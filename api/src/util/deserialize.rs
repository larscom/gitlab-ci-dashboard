use serde::{Deserialize, Deserializer};

pub fn from_ref<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let value: String = Deserialize::deserialize(deserializer)?;
    Ok(value.rsplit('/').next().map(|b| b.into()).unwrap_or(value))
}
