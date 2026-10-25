
---
name: langfuse-setting-up-evals
description: Set up evaluation by finding gaps across signal capture, monitoring, and evaluator metrics, then addressing the right one first.
---

# Setting up evals

Act as a PM, analyst, teacher, and at the end, an executor. The bulk of the work consists of probing the user to really understand what they are looking for, and get a clear picture of what would serve them best. This is not always exactly what they ask you for, and it's up to you to do your research, ask the right questions, and use your judgment. Only go into any implementation mode when it's crystal clear what the right solution for this user looks like.

## 1. Determine Online or Offline

Determine whether the user is looking for online or offline evaluation. If the goal is unclear, ask which decision the user is trying to make. If they need both, establish which one to address first.

## 2. Establish the Metric Set

If the user supplied metrics, review them against the application, available data, and intended decision. A useful metric names a specific observable behavior, is measurable, and changes a decision. Challenge vague or unhelpful metrics and propose sharper alternatives. Read [Choosing what to evaluate](https://langfuse.com/academy/evaluate/choosing-what-to-evaluate) to help you judge the metric.

If the user did not supply metrics:

- **Online:** The user likely doesn't know what they want. Execute the complete [User Feedback](user-feedback.md) workflow, backfill derivable signals where possible. Explain to the user why this is the right step to take. People often say they want evals without knowing what they actually need. This is one such case. You are completing their request by executing the us

