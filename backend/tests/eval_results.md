# DocMind Automated RAG Evaluation Scorecard (Ragas Methodology)

| Metric | Target Benchmark | Measured DocMind Score | Status |
| :--- | :--- | :--- | :--- |
| **Faithfulness (Hallucination Control)** | $\ge 0.85$ | **0.871** (87.1%) | PASSED |
| **Answer Relevance** | $\ge 0.85$ | **0.905** (90.5%) | PASSED |
| **Context Precision** | $\ge 0.85$ | **0.908** (90.8%) | PASSED |

## Evaluated Test Cases
- **[eval_01] Physics / Quantum**: Faithfulness=0.867, Relevance=0.867, Precision=0.889
- **[eval_02] Information Retrieval**: Faithfulness=0.938, Relevance=0.914, Precision=0.833
- **[eval_03] RAG Architecture**: Faithfulness=0.800, Relevance=0.914, Precision=0.929
- **[eval_04] Document Engineering**: Faithfulness=1.000, Relevance=0.891, Precision=1.000
- **[eval_05] Security**: Faithfulness=0.750, Relevance=0.940, Precision=0.889
