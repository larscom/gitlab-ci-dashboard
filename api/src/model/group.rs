use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Group {
    pub id: u64,
    pub name: String,
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use crate::model::{Group, test};

    #[test]
    fn group_deserialize() {
        let value = json!({
            "id": 61012723,
            "web_url": "web_url",
            "name": "Go",
            "path": "go179",
            "description": "",
            "visibility": "public",
            "share_with_group_lock": false,
            "require_two_factor_authentication": false,
            "two_factor_grace_period": 48,
            "project_creation_level": "developer",
            "auto_devops_enabled": null,
            "subgroup_creation_level": "maintainer",
            "emails_disabled": false,
            "emails_enabled": true,
            "mentions_disabled": null,
            "lfs_enabled": true,
            "math_rendering_limits_enabled": true,
            "lock_math_rendering_limits_enabled": false,
            "default_branch": null,
            "default_branch_protection": 2,
            "default_branch_protection_defaults": {
                "allowed_to_push": [
                    {
                        "access_level": 40
                    }
                ],
                "allow_force_push": false,
                "allowed_to_merge": [
                    {
                        "access_level": 40
                    }
                ]
            },
            "avatar_url": null,
            "request_access_enabled": true,
            "full_name": "Go",
            "full_path": "go179",
            "created_at": "2022-12-02T07:34:45.914Z",
            "parent_id": null,
            "organization_id": 1,
            "shared_runners_setting": "enabled",
            "ldap_cn": null,
            "ldap_access": null,
            "wiki_access_level": "enabled"
        });

        let deserialized = serde_json::from_value::<Group>(value).unwrap();
        assert_eq!(deserialized.id, 61012723);
    }

    #[test]
    fn group_serialize() {
        let value = test::new_group();

        let json = serde_json::to_string(&value).unwrap();
        let expected = "{\"id\":1,\"name\":\"name\"}";
        assert_eq!(expected, json);
    }
}
