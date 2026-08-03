use std::future::Future;

use futures::{stream::iter, StreamExt, TryStreamExt};

const MAX_CONCURRENT_REQUESTS: usize = 8;

pub async fn try_collect_with_buffer<I, O, M, F, E>(items: Vec<I>, mapper: M) -> Result<Vec<O>, E>
where
    E: std::error::Error,
    M: Fn(I) -> F,
    F: Future<Output = Result<O, E>>,
{
    if items.is_empty() {
        return Ok(Vec::default());
    }

    // Aggregators can contain hundreds of projects. Sending all of their GitLab
    // requests at once causes an avoidable burst and quickly exhausts the API
    // rate limit.
    let buffer = items.len().min(MAX_CONCURRENT_REQUESTS);
    iter(items).map(mapper).buffered(buffer).try_collect().await
}
