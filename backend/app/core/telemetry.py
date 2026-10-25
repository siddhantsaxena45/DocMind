import time
import os
import logging
import functools
from contextlib import contextmanager, nullcontext
from typing import Optional, Dict, Any, Callable
from app.core.config import settings

logger = logging.getLogger(__name__)

class DocMindTelemetry:
    """
    Production Telemetry & Distributed Tracing Layer powered by Langfuse.
    - Official Langfuse Best Practices: observations-first model, LangChain CallbackHandler,
      span hierarchies, session_id & user_id attribute propagation, and quality scores.
    - 100% Free: Fully compatible with Langfuse Free Cloud Tier (50,000 traces/mo free) or self-hosted.
    - Graceful Degradation: If Langfuse credentials are not provided, gracefully falls back to local
      high-precision latency profiling and structured logging without throwing errors.
    """
    def __init__(self):
        self._client = None
        self._initialized = False
        self._enabled = False
        self._init_langfuse()

    def _init_langfuse(self):
        public_key = settings.LANGFUSE_PUBLIC_KEY or os.getenv("LANGFUSE_PUBLIC_KEY", "")
        secret_key = settings.LANGFUSE_SECRET_KEY or os.getenv("LANGFUSE_SECRET_KEY", "")
        host = settings.LANGFUSE_HOST or os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")
        environment = settings.LANGFUSE_TRACING_ENVIRONMENT or os.getenv("LANGFUSE_TRACING_ENVIRONMENT", "development")

        if public_key and secret_key:
            try:
                # Set environment variables for Langfuse SDK auto-configuration
                os.environ["LANGFUSE_PUBLIC_KEY"] = public_key
                os.environ["LANGFUSE_SECRET_KEY"] = secret_key
                os.environ["LANGFUSE_HOST"] = host
                os.environ["LANGFUSE_TRACING_ENVIRONMENT"] = environment

                from langfuse import Langfuse, get_client
                self._client = Langfuse(
                    public_key=public_key,
                    secret_key=secret_key,
                    host=host,
                    environment=environment
                )
                self._enabled = True
                self._initialized = True
                logger.info(f"[TELEMETRY] Langfuse distributed tracing active (Host: {host}, Env: {environment}).")
            except Exception as e:
                logger.warning(f"[TELEMETRY] Langfuse initialization failed: {e}. Falling back to local telemetry.")
                self._enabled = False
        else:
            logger.info("[TELEMETRY] Langfuse credentials not provided. Operating in local telemetry profiling mode.")
            self._enabled = False

    @property
    def is_enabled(self) -> bool:
        return self._enabled

    def get_client(self):
        return self._client if self._enabled else None

    def get_langfuse_handler(self, trace_context: Optional[Dict[str, Any]] = None):
        """
        Returns a fresh Langfuse CallbackHandler for LangChain / LangGraph execution.
        Captures exact model names, token counts, TTFT latency, and cost automatically.
        """
        if not self._enabled:
            return None
        try:
            from langfuse.langchain import CallbackHandler
            return CallbackHandler(trace_context=trace_context)
        except Exception as e:
            logger.debug(f"[TELEMETRY] CallbackHandler creation notice: {e}")
            return None

    def observe(self, *args, **kwargs):
        """
        Decorator for tracing functions as observations in Langfuse (e.g., as_type='retriever', as_type='tool').
        If Langfuse is active, delegates to langfuse.observe.
        If inactive, wraps function with local latency timing and logging.
        """
        if self._enabled:
            try:
                from langfuse import observe as _langfuse_observe
                return _langfuse_observe(*args, **kwargs)
            except Exception as e:
                logger.debug(f"[TELEMETRY] observe decorator fallback: {e}")

        # Local fallback decorator
        def decorator(func: Callable):
            name = kwargs.get("name") or func.__name__

            if asyncio_iscoroutinefunction(func):
                @functools.wraps(func)
                async def async_wrapper(*f_args, **f_kwargs):
                    start = time.perf_counter()
                    try:
                        res = await func(*f_args, **f_kwargs)
                        elapsed_ms = (time.perf_counter() - start) * 1000.0
                        logger.debug(f"[TELEMETRY] {name} completed in {elapsed_ms:.1f}ms")
                        return res
                    except Exception as err:
                        elapsed_ms = (time.perf_counter() - start) * 1000.0
                        logger.warning(f"[TELEMETRY] {name} failed after {elapsed_ms:.1f}ms: {err}")
                        raise
                return async_wrapper
            else:
                @functools.wraps(func)
                def sync_wrapper(*f_args, **f_kwargs):
                    start = time.perf_counter()
                    try:
                        res = func(*f_args, **f_kwargs)
                        elapsed_ms = (time.perf_counter() - start) * 1000.0
                        logger.debug(f"[TELEMETRY] {name} completed in {elapsed_ms:.1f}ms")
                        return res
                    except Exception as err:
                        elapsed_ms = (time.perf_counter() - start) * 1000.0
                        logger.warning(f"[TELEMETRY] {name} failed after {elapsed_ms:.1f}ms: {err}")
                        raise
                return sync_wrapper

        if len(args) == 1 and callable(args[0]):
            return decorator(args[0])
        return decorator

    @contextmanager
    def propagate_attributes(
        self,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        tags: Optional[list] = None,
        metadata: Optional[dict] = None
    ):
        """
        Propagates session_id (conversation_id), user_id, tags, and metadata to all child observations
        (retrievals, tool calls, and LLM generations) within the context scope.
        """
        if self._enabled:
            try:
                from langfuse import propagate_attributes as _propagate
                kwargs = {}
                if user_id: kwargs["user_id"] = str(user_id)
                if session_id: kwargs["session_id"] = str(session_id)
                if tags: kwargs["tags"] = tags
                if metadata: kwargs["metadata"] = metadata
                with _propagate(**kwargs):
                    yield
                return
            except Exception as e:
                logger.debug(f"[TELEMETRY] Attribute propagation notice: {e}")

        # Local no-op context
        yield

    def record_score(
        self,
        name: str,
        value: float,
        trace_id: Optional[str] = None,
        session_id: Optional[str] = None,
        comment: Optional[str] = None,
        data_type: str = "NUMERIC"
    ):
        """
        Records a quality, evaluation, or guardrail score on the trace or session.
        """
        if self._enabled and self._client:
            try:
                score_args = {
                    "name": name,
                    "value": float(value),
                    "data_type": data_type,
                    "comment": comment
                }
                if trace_id:
                    score_args["trace_id"] = str(trace_id)
                elif session_id:
                    score_args["session_id"] = str(session_id)
                else:
                    logger.debug(f"[TELEMETRY] Skipping score '{name}': neither trace_id nor session_id was provided")
                    return

                self._client.create_score(**score_args)
                logger.debug(f"[TELEMETRY] Score recorded: {name}={value}")
            except Exception as e:
                logger.debug(f"[TELEMETRY] Failed to record score '{name}': {e}")
        else:
            logger.debug(f"[LOCAL SCORE] {name}={value} ({comment or 'no comment'})")

    def record_guardrails_score(
        self,
        passed: bool,
        name: str = "guardrails_passed",
        trace_id: Optional[str] = None,
        session_id: Optional[str] = None,
        reason: Optional[str] = None
    ):
        """
        Records whether security guardrails passed (1.0) or were blocked (0.0).
        """
        value = 1.0 if passed else 0.0
        comment = "Security & formatting checks passed" if passed else f"Blocked: {reason or 'violation'}"
        self.record_score(name=name, value=value, trace_id=trace_id, session_id=session_id, comment=comment)

    def flush(self):
        """
        Synchronously flushes any pending queued events to Langfuse.
        """
        if self._enabled and self._client:
            try:
                self._client.flush()
            except Exception as e:
                logger.debug(f"[TELEMETRY] Error during flush: {e}")

    @contextmanager
    def trace_span(self, name: str, metadata: Optional[Dict[str, Any]] = None):
        """
        Context manager to measure latency of individual pipeline stages.
        """
        start = time.perf_counter()
        span_data = {"name": name, "metadata": metadata or {}, "status": "running"}
        try:
            yield span_data
            span_data["status"] = "success"
        except Exception as e:
            span_data["status"] = "error"
            span_data["error"] = str(e)
            raise
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            span_data["duration_ms"] = round(elapsed_ms, 2)
            logger.info(f"[TELEMETRY] Span '{name}' finished in {span_data['duration_ms']}ms (Status: {span_data['status']})")

    def record_metrics(
        self,
        conversation_id: str,
        user_id: str,
        retrieval_ms: float,
        synthesis_ms: float,
        sources_count: int,
        model: str
    ):
        total_ms = round(retrieval_ms + synthesis_ms, 2)
        summary = {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "model": model,
            "retrieval_ms": round(retrieval_ms, 2),
            "synthesis_ms": round(synthesis_ms, 2),
            "total_ms": total_ms,
            "sources_count": sources_count,
            "estimated_cost_usd": 0.00
        }
        logger.info(f"[TRACE METRICS] {summary}")
        return summary


def asyncio_iscoroutinefunction(func: Any) -> bool:
    import inspect
    return inspect.iscoroutinefunction(func)

telemetry = DocMindTelemetry()
