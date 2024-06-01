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

#[cfg(test)]
mod tests {
    use serde_json::json;

    use crate::model::test;
    use crate::model::user::User;

    #[test]
    fn user_deserialize() {
        let value = json!({
                "id": 13081321,
                "username": "gitlab.ci.dashboard",
                "name": "Gitlab CI Dashboard",
                "state": "active",
                "locked": false,
                "avatar_url": "avatar_url",
                "web_url": "web_url",
                "created_at": "2022-11-18T17:46:13.632Z",
                "bio": "",
                "location": "",
                "public_email": "",
                "skype": "",
                "linkedin": "",
                "twitter": "",
                "discord": "",
                "website_url": "",
                "organization": "",
                "job_title": "",
                "pronouns": "",
                "bot": false,
                "work_information": null,
                "followers": 0,
                "following": 0,
                "local_time": "7:12 PM"
        });

        let deserialized = serde_json::from_value::<User>(value).unwrap();
        assert_eq!(deserialized.id, 13081321);
        assert!(!deserialized.is_admin)
    }

    #[test]
    fn user_serialize() {
        let value = test::new_user();

        let json = serde_json::to_string(&value).unwrap();
        let expected = "{\"id\":123,\"username\":\"username\",\"name\":\"name\",\"state\":\"state\",\"is_admin\":false}";
        assert_eq!(expected, json);
    }
}
