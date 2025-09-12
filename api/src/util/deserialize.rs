use serde::{Deserialize, Deserializer};

pub fn from_ref<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let value: String = Deserialize::deserialize(deserializer)?;
    Ok(value.rsplit('/').next().map(|b| b.into()).unwrap_or(value))
}

pub fn into_opt_f64<'de, D>(deserializer: D) -> Result<Option<f64>, D::Error>
where
    D: Deserializer<'de>,
{
    match Option::<String>::deserialize(deserializer)? {
        Some(value) => value.parse().map(Some).map_err(serde::de::Error::custom),
        None => Ok(None),
    }
}
