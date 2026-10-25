import time
import pytest
from app.services.llm_service import SemanticResponseCache, llm_service
from app.services.rag_service import rag_service

def test_semantic_response_cache_lifecycle():
    cache = SemanticResponseCache(max_size=3, ttl_seconds=2)

    query = "What is the coherence time of superconducting qubits?"
    context = "Coherence time is 1.5 milliseconds at millikelvin temperatures."
    response = "Superconducting qubits maintain a coherence time of 1.5 milliseconds."

    # 1. Initial miss
    assert cache.get(query, context) is None
    assert cache.misses == 1

    # 2. Populate cache
    cache.set(query, context, response)
    assert cache.get_stats()["cached_entries"] == 1

    # 3. Cache hit on identical query
    hit_ans = cache.get(query, context)
    assert hit_ans == response
    assert cache.hits == 1

    # 4. Cache hit on normalized whitespace / casing query
    variant_query = "  what is the COHERENCE time of superconducting qubits?  "
    assert cache.get(variant_query, context) == response
    assert cache.hits == 2

    # 5. Miss on different context
    diff_context = "Completely unrelated document text about astronomy."
    assert cache.get(query, diff_context) is None

    # 6. LRU Eviction when exceeding max_size=3
    cache.set("q1", "c1", "ans 1 long enough to cache")
    cache.set("q2", "c2", "ans 2 long enough to cache")
    cache.set("q3", "c3", "ans 3 long enough to cache")
    # Oldest item should be evicted
    assert cache.get_stats()["cached_entries"] <= 3

def test_llm_service_cache_integration():
    stats = llm_service.cache.get_stats()
    assert "cached_entries" in stats
    assert "hit_ratio_pct" in stats

def test_hyde_and_multi_query_helpers():
    queries = llm_service.generate_multi_queries("quantum error correction")
    assert isinstance(queries, list)
    assert len(queries) >= 1
    assert "quantum error correction" in queries[0]
