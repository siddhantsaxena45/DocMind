
---
name: langfuse-cli
description: Langfuse CLI usage reference — install, resource/action discovery, credentials, and common usage tips for `langfuse-cli`. Use for further tips on using the Langfuse CLI.
---

# Langfuse CLI Reference

Documentation: https://langfuse.com/docs/api-and-data-platform/features/cli

## Install

```bash
# Run directly (recommended)
npx langfuse-cli api <resource> <action>
bunx langfuse-cli api <resource> <action>

# Or install globally
npm i -g langfuse-cli
langfuse api <resource> <action>
```

## Discovery

```bash
# List all resources and auth info
langfuse api __schema

# List actions for a resource
langfuse api <resource> --help

# Show args/options for a specific action
langfuse api <resource> <action> --help

# Preview the curl command without executing
langfuse api <resource> <action> --curl
```

## Credentials

Set environment variables:

```bash
export LANGFUSE_PUBLIC_KEY=pk-lf-...
export LANGFUSE_SECRET_KEY=sk-lf-...
export LAN

