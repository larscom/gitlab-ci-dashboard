use crate::error::ApiError;
use actix_web::cookie::{Cookie, SameSite};
use actix_web::{web, HttpRequest, HttpResponse};
use argon2::password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, SaltString};
use argon2::{Argon2, PasswordVerifier};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

const COOKIE_NAME: &str = "gcd_session";
const MAX_FAILED_ATTEMPTS: usize = 5;
const LOGIN_WINDOW: Duration = Duration::from_secs(60);

#[derive(Clone)]
struct Session { user_id: i64, username: String, role: String }

#[derive(Clone)]
pub struct AuthState {
    pool: PgPool,
    secure_cookie: bool,
    sessions: Arc<Mutex<HashMap<String, Session>>>,
    failed_attempts: Arc<Mutex<VecDeque<Instant>>>,
    allow_unauthenticated: bool,
}

#[derive(Deserialize)] struct LoginRequest { username: String, password: String }
#[derive(Serialize)] struct AuthStatus { authenticated: bool, enabled: bool, username: Option<String>, role: Option<String> }
#[derive(Serialize)] struct UserView { id:i64, username:String, display_name:String, email:String, role:String, enabled:bool, created_at:chrono::DateTime<chrono::Utc> }
#[derive(Deserialize)] struct CreateUser { username:String, password:String, #[serde(default)] display_name:String, #[serde(default)] email:String, role:String }
#[derive(Deserialize)] struct UpdateUser { username:String, #[serde(default)] password:String, #[serde(default)] display_name:String, #[serde(default)] email:String, role:String, enabled:bool }
#[derive(Serialize)] struct UserPreferences { theme:String, favorite_projects:serde_json::Value }
#[derive(Deserialize)] struct ThemePreference { theme:String }
#[derive(Deserialize)] struct FavoriteProjectsPreference { favorite_projects:serde_json::Value }

impl AuthState {
    pub async fn new(pool: PgPool, config: &crate::config::config_file::Authentication) -> Result<Self, String> {
        if config.username.is_empty() != config.password.is_empty() { return Err("authentication.username and authentication.password must both be set".into()) }
        if !config.username.is_empty() {
            let count:i64=sqlx::query_scalar("SELECT COUNT(*) FROM app_users").fetch_one(&pool).await.map_err(|e|e.to_string())?;
            if count==0 {
                let hash=hash_password(&config.password)?;
                sqlx::query("INSERT INTO app_users(username,password_hash,display_name,role) VALUES($1,$2,$1,'admin')")
                    .bind(config.username.trim()).bind(hash).execute(&pool).await.map_err(|e|e.to_string())?;
                log::info!("Created initial administrator account from config.toml");
            }
        }
        Ok(Self { pool, secure_cookie:config.secure_cookie, sessions:Arc::new(Mutex::new(HashMap::new())), failed_attempts:Arc::new(Mutex::new(VecDeque::new())), allow_unauthenticated:false })
    }
    fn session(&self, request:&HttpRequest)->Option<Session>{request.cookie(COOKIE_NAME).and_then(|c|self.sessions.lock().ok()?.get(c.value()).cloned())}
    pub fn is_authenticated(&self, request:&HttpRequest)->bool{self.allow_unauthenticated||self.session(request).is_some()}
    pub fn require_admin(&self, request:&HttpRequest)->Result<(),ApiError>{if self.allow_unauthenticated{return Ok(())}match self.session(request){Some(s) if s.role=="admin"=>Ok(()),Some(_)=>Err(ApiError::forbidden("Administrator access is required")),None=>Err(ApiError::forbidden("Authentication is required"))}}
    fn require_user_id(&self, request:&HttpRequest)->Result<i64,ApiError>{self.session(request).map(|s|s.user_id).ok_or_else(||ApiError::forbidden("Authentication is required"))}
    fn limited(&self)->bool{let mut a=self.failed_attempts.lock().expect("login attempts lock");let cutoff=Instant::now()-LOGIN_WINDOW;while a.front().is_some_and(|v|*v<cutoff){a.pop_front();}a.len()>=MAX_FAILED_ATTEMPTS}

    #[cfg(test)]
    pub fn for_test() -> Self {
        let pool=sqlx::postgres::PgPoolOptions::new().connect_lazy("postgres://test:test@localhost/test").expect("test pool");
        Self { pool, secure_cookie:false, sessions:Arc::new(Mutex::new(HashMap::new())), failed_attempts:Arc::new(Mutex::new(VecDeque::new())), allow_unauthenticated:true }
    }
}

pub fn setup_handlers(cfg:&mut web::ServiceConfig){cfg.route("/status",web::get().to(status)).route("/login",web::post().to(login)).route("/logout",web::post().to(logout));}
pub fn setup_user_handlers(cfg:&mut web::ServiceConfig){cfg.route("/users",web::get().to(list_users)).route("/users",web::post().to(create_user)).route("/users/{id}",web::put().to(update_user)).route("/users/{id}",web::delete().to(delete_user)).route("/preferences",web::get().to(get_preferences)).route("/preferences/theme",web::put().to(save_theme)).route("/preferences/favorites",web::put().to(save_favorites));}

async fn status(req:HttpRequest,auth:web::Data<AuthState>)->HttpResponse{let s=auth.session(&req);HttpResponse::Ok().json(AuthStatus{authenticated:auth.allow_unauthenticated||s.is_some(),enabled:true,username:s.as_ref().map(|v|v.username.clone()),role:s.map(|v|v.role)})}
async fn login(input:web::Json<LoginRequest>,auth:web::Data<AuthState>)->HttpResponse{
    if auth.limited(){return HttpResponse::TooManyRequests().json(serde_json::json!({"message":"Too many login attempts. Try again in one minute."}))}
    let row=sqlx::query("SELECT id,username,password_hash,role FROM app_users WHERE LOWER(username)=LOWER($1) AND enabled=TRUE").bind(input.username.trim()).fetch_optional(&auth.pool).await;
    if let Ok(Some(row))=row { let hash:String=row.get("password_hash"); if verify_password(&input.password,&hash) { auth.failed_attempts.lock().expect("login attempts lock").clear();let token=random_token();let session=Session{user_id:row.get("id"),username:row.get("username"),role:row.get("role")};auth.sessions.lock().expect("sessions lock").insert(token.clone(),session.clone());let cookie=Cookie::build(COOKIE_NAME,token).path("/").http_only(true).secure(auth.secure_cookie).same_site(SameSite::Lax).finish();return HttpResponse::Ok().insert_header(("Cache-Control","no-store")).cookie(cookie).json(AuthStatus{authenticated:true,enabled:true,username:Some(session.username),role:Some(session.role)})}}
    auth.failed_attempts.lock().expect("login attempts lock").push_back(Instant::now());HttpResponse::Unauthorized().json(serde_json::json!({"message":"Invalid username or password"}))
}
async fn logout(req:HttpRequest,auth:web::Data<AuthState>)->HttpResponse{if let Some(c)=req.cookie(COOKIE_NAME){auth.sessions.lock().expect("sessions lock").remove(c.value());}let mut cookie=Cookie::build(COOKIE_NAME,"").path("/").finish();cookie.make_removal();HttpResponse::Ok().cookie(cookie).finish()}

async fn list_users(req:HttpRequest,auth:web::Data<AuthState>)->Result<HttpResponse,ApiError>{auth.require_admin(&req)?;let rows=sqlx::query("SELECT id,username,display_name,email,role,enabled,created_at FROM app_users ORDER BY LOWER(username)").fetch_all(&auth.pool).await.map_err(db)?;let users=rows.into_iter().map(|r|UserView{id:r.get("id"),username:r.get("username"),display_name:r.get("display_name"),email:r.get("email"),role:r.get("role"),enabled:r.get("enabled"),created_at:r.get("created_at")}).collect::<Vec<_>>();Ok(HttpResponse::Ok().json(users))}
async fn create_user(req:HttpRequest,auth:web::Data<AuthState>,input:web::Json<CreateUser>)->Result<HttpResponse,ApiError>{auth.require_admin(&req)?;validate(&input.username,&input.role,Some(&input.password))?;let hash=hash_password(&input.password).map_err(ApiError::server_error)?;let row=sqlx::query("INSERT INTO app_users(username,password_hash,display_name,email,role) VALUES($1,$2,$3,$4,$5) RETURNING id").bind(input.username.trim()).bind(hash).bind(input.display_name.trim()).bind(input.email.trim()).bind(&input.role).fetch_one(&auth.pool).await.map_err(db)?;Ok(HttpResponse::Created().json(serde_json::json!({"id":row.get::<i64,_>("id")})))}
async fn update_user(req:HttpRequest,auth:web::Data<AuthState>,path:web::Path<i64>,input:web::Json<UpdateUser>)->Result<HttpResponse,ApiError>{auth.require_admin(&req)?;validate(&input.username,&input.role,None)?;let id=path.into_inner();if let Some(current)=auth.session(&req){if current.user_id==id&&(!input.enabled||input.role!="admin"){return Err(ApiError::bad_request("You cannot disable or remove your own administrator role"))}}if input.password.is_empty(){sqlx::query("UPDATE app_users SET username=$1,display_name=$2,email=$3,role=$4,enabled=$5,updated_at=NOW() WHERE id=$6").bind(input.username.trim()).bind(input.display_name.trim()).bind(input.email.trim()).bind(&input.role).bind(input.enabled).bind(id).execute(&auth.pool).await.map_err(db)?;}else{let hash=hash_password(&input.password).map_err(ApiError::server_error)?;sqlx::query("UPDATE app_users SET username=$1,password_hash=$2,display_name=$3,email=$4,role=$5,enabled=$6,updated_at=NOW() WHERE id=$7").bind(input.username.trim()).bind(hash).bind(input.display_name.trim()).bind(input.email.trim()).bind(&input.role).bind(input.enabled).bind(id).execute(&auth.pool).await.map_err(db)?;}auth.sessions.lock().expect("sessions lock").retain(|_,session|session.user_id!=id);Ok(HttpResponse::NoContent().finish())}
async fn delete_user(req:HttpRequest,auth:web::Data<AuthState>,path:web::Path<i64>)->Result<HttpResponse,ApiError>{auth.require_admin(&req)?;let id=path.into_inner();if auth.session(&req).is_some_and(|s|s.user_id==id){return Err(ApiError::bad_request("You cannot delete your own account"))}let role:Option<String>=sqlx::query_scalar("SELECT role FROM app_users WHERE id=$1").bind(id).fetch_optional(&auth.pool).await.map_err(db)?;if role.as_deref()==Some("admin"){let count:i64=sqlx::query_scalar("SELECT COUNT(*) FROM app_users WHERE role='admin' AND enabled=TRUE").fetch_one(&auth.pool).await.map_err(db)?;if count<=1{return Err(ApiError::bad_request("At least one enabled administrator is required"))}}sqlx::query("DELETE FROM app_users WHERE id=$1").bind(id).execute(&auth.pool).await.map_err(db)?;auth.sessions.lock().expect("sessions lock").retain(|_,session|session.user_id!=id);Ok(HttpResponse::NoContent().finish())}

async fn get_preferences(req:HttpRequest,auth:web::Data<AuthState>)->Result<HttpResponse,ApiError>{let user_id=auth.require_user_id(&req)?;let row=sqlx::query("SELECT theme,favorite_projects FROM app_user_preferences WHERE user_id=$1").bind(user_id).fetch_optional(&auth.pool).await.map_err(db)?;let preferences=match row{Some(row)=>UserPreferences{theme:row.get("theme"),favorite_projects:row.get("favorite_projects")},None=>UserPreferences{theme:"light".into(),favorite_projects:serde_json::json!({})}};Ok(HttpResponse::Ok().insert_header(("Cache-Control","no-store")).json(preferences))}
async fn save_theme(req:HttpRequest,auth:web::Data<AuthState>,input:web::Json<ThemePreference>)->Result<HttpResponse,ApiError>{let user_id=auth.require_user_id(&req)?;if !matches!(input.theme.as_str(),"light"|"dracula"){return Err(ApiError::bad_request("Theme must be light or dracula"))}sqlx::query("INSERT INTO app_user_preferences(user_id,theme) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET theme=EXCLUDED.theme,updated_at=NOW()").bind(user_id).bind(&input.theme).execute(&auth.pool).await.map_err(db)?;Ok(HttpResponse::NoContent().finish())}
async fn save_favorites(req:HttpRequest,auth:web::Data<AuthState>,input:web::Json<FavoriteProjectsPreference>)->Result<HttpResponse,ApiError>{let user_id=auth.require_user_id(&req)?;if !input.favorite_projects.is_object(){return Err(ApiError::bad_request("Favorite projects must be an object"))}sqlx::query("INSERT INTO app_user_preferences(user_id,favorite_projects) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET favorite_projects=EXCLUDED.favorite_projects,updated_at=NOW()").bind(user_id).bind(&input.favorite_projects).execute(&auth.pool).await.map_err(db)?;Ok(HttpResponse::NoContent().finish())}

fn validate(username:&str,role:&str,password:Option<&str>)->Result<(),ApiError>{if username.trim().is_empty(){return Err(ApiError::bad_request("Username is required"))}if !matches!(role,"admin"|"editor"){return Err(ApiError::bad_request("Role must be admin or editor"))}if password.is_some_and(|p|p.len()<8){return Err(ApiError::bad_request("Password must contain at least 8 characters"))}Ok(())}
fn hash_password(value:&str)->Result<String,String>{let salt=SaltString::generate(&mut OsRng);Argon2::default().hash_password(value.as_bytes(),&salt).map(|v|v.to_string()).map_err(|e|e.to_string())}
fn verify_password(value:&str,hash:&str)->bool{PasswordHash::new(hash).ok().is_some_and(|h|Argon2::default().verify_password(value.as_bytes(),&h).is_ok())}
fn random_token()->String{rand::random::<[u8;32]>().iter().map(|b|format!("{b:02x}")).collect()}
fn db(e:sqlx::Error)->ApiError{if let sqlx::Error::Database(ref d)=e{if d.is_unique_violation(){return ApiError::bad_request("Username already exists")}}ApiError::server_error(format!("User database error: {e}"))}
