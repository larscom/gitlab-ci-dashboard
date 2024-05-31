use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct User {
    pub id: u64,
    pub username: String,
    pub name: String,
    pub state: String,
    #[serde(default)]
    pub is_admin: bool,
}
