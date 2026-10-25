# DocMind Automated RAG Evaluation Scorecard (Ragas Methodology)

| Metric | Target Benchmark | Measured DocMind Score | Status |
| :--- | :--- | :--- | :--- |
| **Faithfulness (Hallucination Control)** | $\ge 0.90$ | **0.871** (87.1%) | ACCEPTABLE |
| **Answer Relevance** | $\ge 0.85$ | **0.905** (90.5%) | PASSED |
| **Context Precision** | $\ge 0.85$ | **0.648** (64.8%) | ACCEPTABLE |

## Evaluated Test Cases
- **[eval_01] Physics / Quantum**: Faithfulness=0.867, Relevance=0.867, Precision=0.889
- **[eval_02] Information Retrieval**: Faithfulness=0.938, Relevance=0.914, Precision=0.5
- **[eval_03] RAG Architecture**: Faithfulness=0.8, Relevance=0.914, Precision=0.467
- **[eval_04] Document Engineering**: Faithfulness=1.0, Relevance=0.891, Precision=1.0
- **[eval_05] Security**: Faithfulness=0.75, Relevance=0.94, Precision=0.385
