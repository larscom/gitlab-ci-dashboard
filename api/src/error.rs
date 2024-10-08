use actix_web::{
    http::{header::ContentType, StatusCode},
    HttpResponse, ResponseError,
};
use serde::Serialize;
use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Clone, Debug, Serialize)]
pub struct ApiError {
    status_code: u16,
    message: String,
}

impl ApiError {
    pub fn new(status_code: StatusCode, message: String) -> Self {
        Self {
            status_code: status_code.as_u16(),
            message,
        }
    }

    pub fn with_u16_code(status_code: u16, message: String) -> Self {
        Self {
            status_code,
            message,
        }
    }

    pub fn server_error(message: String) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, message)
    }

    pub fn bad_request(message: String) -> Self {
        Self::new(StatusCode::BAD_REQUEST, message)
    }
}

impl Default for ApiError {
    fn default() -> Self {
        Self::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "an internal server error occured".into(),
        )
    }
}

impl Display for ApiError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "Error {}: {}", self.status_code, self.message)
    }
}

impl Error for ApiError {}

impl From<reqwest::Error> for ApiError {
    fn from(error: reqwest::Error) -> Self {
        if error.is_status() {
            return error.status().map_or_else(ApiError::default, |code| {
                ApiError::with_u16_code(code.as_u16(), error.to_string())
            });
        }
        match error.source() {
            Some(source) => ApiError::server_error(source.to_string()),
            None => ApiError::server_error(error.to_string()),
        }
    }
}

impl ResponseError for ApiError {
    fn status_code(&self) -> StatusCode {
        StatusCode::from_u16(self.status_code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR)
    }

    fn error_response(&self) -> HttpResponse {
        let status_code = self.status_code();
        let error_message = self.message.clone();
        serde_json::to_string(&ApiError::new(status_code, error_message)).map_or(
            HttpResponse::build(status_code)
                .insert_header(ContentType::plaintext())
                .body(self.to_string()),
            |json| {
                HttpResponse::build(status_code)
                    .insert_header(ContentType::json())
                    .body(json)
            },
        )
    }
}
