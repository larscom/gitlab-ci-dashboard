use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Commit {
    pub id: String,
    pub author_name: String,
    pub committer_name: String,
    pub committed_date: DateTime<Utc>,
    pub title: String,
    pub message: String,
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use crate::model::commit::Commit;
    use crate::model::test;

    #[test]
    fn commit_deserialize() {
        let value = json!({
            "id": "6797a390bf73f89096af2e1dbade0a23a89e3a9e",
            "short_id": "6797a390",
            "created_at": "2024-06-01T10:41:16.000+00:00",
            "parent_ids": [
                "97a41ecb5ff1e1f75cf24952511c59c18e376b9c"
            ],
            "title": "Update .gitlab-ci.yml file",
            "message": "Update .gitlab-ci.yml file",
            "author_name": "Gitlab CI Dashboard",
            "author_email": "gitlab.ci.dashboard@gmail.com",
            "authored_date": "2024-06-01T10:41:16.000+00:00",
            "committer_name": "Gitlab CI Dashboard",
            "committer_email": "gitlab.ci.dashboard@gmail.com",
            "committed_date": "2024-06-01T10:41:16.000+00:00",
            "trailers": {},
            "extended_trailers": {},
            "web_url": "web_url"
        });

        let deserialized = serde_json::from_value::<Commit>(value).unwrap();
        assert_eq!(deserialized.id, "6797a390bf73f89096af2e1dbade0a23a89e3a9e");
    }

    #[test]
    fn commit_serialize() {
        let value = test::new_commit();

        let json = serde_json::to_string(&value).unwrap();
        let expected = "{\"id\":\"id\",\"author_name\":\"author_name\",\"committer_name\":\"committer_name\",\"committed_date\":\"1970-01-01T00:00:00Z\",\"title\":\"title\",\"message\":\"message\"}";
        assert_eq!(expected, json);
    }
}
