use crate::model::Pipeline;
use std::cmp::Ordering;

pub fn sort_by_updated_date(a: Option<&Pipeline>, b: Option<&Pipeline>) -> Ordering {
    match (a, b) {
        (Some(a), Some(b)) => b.updated_at.cmp(&a.updated_at),
        (None, Some(_)) => Ordering::Less,
        (Some(_), None) => Ordering::Greater,
        _ => Ordering::Equal,
    }
}
