import os

import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_client = redis.Redis.from_url(REDIS_URL)


def get_redis_client() -> redis.Redis:
    """Return the shared Redis client used to enqueue background jobs."""
    return redis_client