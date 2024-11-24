use std::future::Future;

use futures::{stream::iter, StreamExt, TryStreamExt};

pub async fn try_collect_with_buffer<I, O, M, F, E>(items: Vec<I>, mapper: M) -> Result<Vec<O>, E>
where
    E: std::error::Error,
    M: Fn(I) -> F,
    F: Future<Output = Result<O, E>>,
{
    if items.is_empty() {
        return Ok(Vec::default());
    }

    let buffer = items.len();
    iter(items).map(mapper).buffered(buffer).try_collect().await
}
