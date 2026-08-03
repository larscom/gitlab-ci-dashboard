use crate::error::ApiError;
use crate::federated_gitlab::{EnvironmentClientConfig, FederatedGitlabClient};
use crate::group::GroupService;
use actix_web::{web, HttpRequest, HttpResponse};
use aes_gcm::{aead::{Aead, OsRng, rand_core::RngCore}, Aes256Gcm, KeyInit, Nonce};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use std::sync::Arc;

#[derive(Clone)]
pub struct EnvironmentStore { pool: PgPool, cipher: Aes256Gcm }

#[derive(Serialize)]
pub struct EnvironmentView {
    id: i64, namespace_id: i16, name: String, base_url: String,
    group_ids: Vec<i64>, enabled: bool, only_top_level: bool, include_subgroups: bool,
    token_configured: bool, last_tested_at: Option<chrono::DateTime<chrono::Utc>>, last_error: Option<String>,
}
#[derive(Deserialize)]
pub struct EnvironmentInput {
    name: String, base_url: String, #[serde(default)] token: String,
    #[serde(default)] group_ids: Vec<i64>,
    #[serde(default = "default_true")] enabled: bool,
    #[serde(default = "default_true")] only_top_level: bool,
    #[serde(default = "default_true")] include_subgroups: bool,
}
#[derive(Serialize, Deserialize)]
pub struct GlobalConfig { company_name: String, #[serde(default)] company_logo: String }
fn default_true() -> bool { true }

impl EnvironmentStore {
    pub fn new(pool: PgPool, key_hex: &str) -> Result<Self, String> {
        let key = hex::decode(key_hex).map_err(|_| "security.environment_token_encryption_key must be hexadecimal")?;
        if key.len() != 32 { return Err("security.environment_token_encryption_key must contain exactly 64 hex characters".into()) }
        Ok(Self { pool, cipher: Aes256Gcm::new_from_slice(&key).map_err(|_| "invalid encryption key")? })
    }
    fn encrypt(&self, token: &str) -> Result<Vec<u8>, ApiError> {
        let mut nonce_bytes = [0u8; 12]; OsRng.fill_bytes(&mut nonce_bytes);
        let encrypted = self.cipher.encrypt(Nonce::from_slice(&nonce_bytes), token.as_bytes())
            .map_err(|_| ApiError::server_error("Unable to encrypt environment token"))?;
        Ok([nonce_bytes.to_vec(), encrypted].concat())
    }
    fn decrypt(&self, value: &[u8]) -> Result<String, ApiError> {
        if value.len() < 13 { return Err(ApiError::server_error("Invalid encrypted environment token")) }
        let plain = self.cipher.decrypt(Nonce::from_slice(&value[..12]), &value[12..])
            .map_err(|_| ApiError::server_error("Unable to decrypt environment token"))?;
        String::from_utf8(plain).map_err(|_| ApiError::server_error("Invalid environment token encoding"))
    }
    pub async fn clients(&self) -> Result<Vec<EnvironmentClientConfig>, ApiError> {
        let rows = sqlx::query("SELECT namespace_id,name,base_url,token_ciphertext,group_ids FROM gitlab_environments WHERE enabled=TRUE ORDER BY id").fetch_all(&self.pool).await.map_err(db_error)?;
        rows.into_iter().map(|r| Ok(EnvironmentClientConfig { index: r.get::<i16,_>("namespace_id") as usize, name: r.get("name"), url: r.get("base_url"), token: self.decrypt(r.get("token_ciphertext"))?, group_ids: r.get::<Vec<i64>,_>("group_ids").into_iter().map(|id|id as u64).collect() })).collect()
    }
    async fn list(&self) -> Result<Vec<EnvironmentView>, ApiError> {
        let rows=sqlx::query("SELECT id,namespace_id,name,base_url,group_ids,enabled,only_top_level,include_subgroups,last_tested_at,last_error FROM gitlab_environments ORDER BY name").fetch_all(&self.pool).await.map_err(db_error)?;
        Ok(rows.into_iter().map(|r| EnvironmentView { id:r.get("id"), namespace_id:r.get("namespace_id"), name:r.get("name"), base_url:r.get("base_url"), group_ids:r.get("group_ids"), enabled:r.get("enabled"), only_top_level:r.get("only_top_level"), include_subgroups:r.get("include_subgroups"), token_configured:true, last_tested_at:r.get("last_tested_at"), last_error:r.get("last_error") }).collect())
    }
}
fn db_error(e: sqlx::Error) -> ApiError { ApiError::server_error(format!("Environment database error: {e}")) }

pub fn setup_handlers(cfg: &mut web::ServiceConfig) {
    cfg.route("/environments", web::get().to(list)).route("/environments", web::post().to(create)).route("/environments/{id}", web::patch().to(update)).route("/environments/{id}", web::delete().to(remove))
       .route("/global-config", web::get().to(get_global_config)).route("/global-config", web::put().to(save_global_config));
}
async fn list(store:web::Data<EnvironmentStore>) -> Result<HttpResponse,ApiError> { Ok(HttpResponse::Ok().json(store.list().await?)) }
async fn get_global_config(store:web::Data<EnvironmentStore>) -> Result<HttpResponse,ApiError> {
    let row=sqlx::query("SELECT company_name,company_logo FROM app_global_settings WHERE singleton=TRUE").fetch_one(&store.pool).await.map_err(db_error)?;
    Ok(HttpResponse::Ok().json(GlobalConfig{company_name:row.get("company_name"),company_logo:row.get("company_logo")}))
}
async fn save_global_config(req:HttpRequest, auth:web::Data<crate::auth::AuthState>, input:web::Json<GlobalConfig>, store:web::Data<EnvironmentStore>) -> Result<HttpResponse,ApiError> {
    auth.require_admin(&req)?;
    if input.company_name.trim().is_empty(){return Err(ApiError::bad_request("Company name is required"))}
    sqlx::query("INSERT INTO app_global_settings(singleton,company_name,company_logo) VALUES(TRUE,$1,$2) ON CONFLICT(singleton) DO UPDATE SET company_name=EXCLUDED.company_name,company_logo=EXCLUDED.company_logo,updated_at=NOW()")
        .bind(input.company_name.trim()).bind(&input.company_logo).execute(&store.pool).await.map_err(db_error)?;
    Ok(HttpResponse::NoContent().finish())
}
async fn create(req:HttpRequest, auth:web::Data<crate::auth::AuthState>, input:web::Json<EnvironmentInput>, store:web::Data<EnvironmentStore>, clients:web::Data<Arc<FederatedGitlabClient>>, groups:web::Data<GroupService>) -> Result<HttpResponse,ApiError> {
    auth.require_admin(&req)?;
    if input.name.trim().is_empty() || input.base_url.trim().is_empty() || input.token.trim().is_empty() { return Err(ApiError::bad_request("Name, GitLab URL, and token are required")) }
    let encrypted=store.encrypt(input.token.trim())?;
    let row=sqlx::query("INSERT INTO gitlab_environments(namespace_id,name,base_url,token_ciphertext,group_ids,enabled,only_top_level,include_subgroups) VALUES((SELECT COALESCE(MAX(namespace_id),-1)+1 FROM gitlab_environments),$1,$2,$3,$4,$5,$6,$7) RETURNING id")
        .bind(input.name.trim()).bind(input.base_url.trim_end_matches('/')).bind(encrypted).bind(&input.group_ids).bind(input.enabled).bind(input.only_top_level).bind(input.include_subgroups).fetch_one(&store.pool).await.map_err(db_error)?;
    clients.replace(store.clients().await?);
    groups.invalidate();
    Ok(HttpResponse::Created().json(serde_json::json!({"id":row.get::<i64,_>("id")})))
}
async fn update(req:HttpRequest, auth:web::Data<crate::auth::AuthState>, path:web::Path<i64>, input:web::Json<EnvironmentInput>, store:web::Data<EnvironmentStore>, clients:web::Data<Arc<FederatedGitlabClient>>, groups:web::Data<GroupService>) -> Result<HttpResponse,ApiError> {
    auth.require_admin(&req)?;
    if input.name.trim().is_empty() || input.base_url.trim().is_empty() { return Err(ApiError::bad_request("Name and GitLab URL are required")) }
    let id=path.into_inner();
    if input.token.trim().is_empty() {
        sqlx::query("UPDATE gitlab_environments SET name=$1,base_url=$2,group_ids=$3,enabled=$4,only_top_level=$5,include_subgroups=$6,updated_at=NOW() WHERE id=$7")
            .bind(input.name.trim()).bind(input.base_url.trim_end_matches('/')).bind(&input.group_ids).bind(input.enabled).bind(input.only_top_level).bind(input.include_subgroups).bind(id).execute(&store.pool).await.map_err(db_error)?;
    } else {
        let encrypted=store.encrypt(input.token.trim())?;
        sqlx::query("UPDATE gitlab_environments SET name=$1,base_url=$2,token_ciphertext=$3,group_ids=$4,enabled=$5,only_top_level=$6,include_subgroups=$7,updated_at=NOW() WHERE id=$8")
            .bind(input.name.trim()).bind(input.base_url.trim_end_matches('/')).bind(encrypted).bind(&input.group_ids).bind(input.enabled).bind(input.only_top_level).bind(input.include_subgroups).bind(id).execute(&store.pool).await.map_err(db_error)?;
    }
    clients.replace(store.clients().await?); groups.invalidate(); Ok(HttpResponse::NoContent().finish())
}
async fn remove(req:HttpRequest, auth:web::Data<crate::auth::AuthState>, path:web::Path<i64>, store:web::Data<EnvironmentStore>, clients:web::Data<Arc<FederatedGitlabClient>>, groups:web::Data<GroupService>) -> Result<HttpResponse,ApiError> {
    auth.require_admin(&req)?;
    sqlx::query("DELETE FROM gitlab_environments WHERE id=$1").bind(path.into_inner()).execute(&store.pool).await.map_err(db_error)?;
    clients.replace(store.clients().await?); groups.invalidate(); Ok(HttpResponse::NoContent().finish())
}
