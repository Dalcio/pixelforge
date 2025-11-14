"# PixelForge

A cloud-based image processing framework with agent delegation capabilities.

## Overview

PixelForge provides a flexible system for delegating image processing tasks to specialized cloud agents. This allows for distributed, scalable image processing operations.

## Features

- **Cloud Agent Delegation**: Delegate image processing tasks to specialized cloud agents
- **Multiple Agent Types**: Support for different types of processing agents (filters, resize, composite, etc.)
- **Extensible Architecture**: Easy to add new agent types and capabilities
- **Simple API**: Clean, pythonic interface for task delegation

## Cloud Agent System

The cloud agent delegation system allows you to offload image processing tasks to cloud-based workers:

### Agent Types

- **IMAGE_PROCESSOR**: General-purpose image processing
- **FILTER_AGENT**: Apply filters and effects
- **RESIZE_AGENT**: Image resizing and scaling operations
- **COMPOSITE_AGENT**: Combine multiple images

### Usage Example

```python
from cloud_agent import create_default_delegator

# Create delegator with registered agents
delegator = create_default_delegator()

# Delegate a task to the processor agent
result = delegator.delegate_task(
    "processor",
    {
        "image": "path/to/image.png",
        "operation": "enhance",
        "parameters": {"brightness": 1.2, "contrast": 1.1}
    }
)

print(result)
```

### Custom Agent Registration

```python
from cloud_agent import CloudAgent, CloudAgentDelegator, AgentType

# Create a custom delegator
delegator = CloudAgentDelegator()

# Register a custom agent
custom_agent = CloudAgent(
    AgentType.IMAGE_PROCESSOR,
    endpoint="https://my-custom-endpoint.com/process"
)
delegator.register_agent("custom", custom_agent)

# Use the custom agent
result = delegator.delegate_task("custom", {...})
```

## Installation

```bash
pip install pixelforge
```

## Requirements

- Python 3.7+
- Network connectivity for cloud agent communication

## Architecture

The system is built around the concept of delegating specific image processing tasks to specialized cloud agents. Each agent is responsible for a particular type of operation, allowing for:

- **Scalability**: Distribute load across multiple cloud agents
- **Specialization**: Each agent optimized for specific operations
- **Flexibility**: Easy to add new agents or modify existing ones
- **Reliability**: Fallback and retry mechanisms (planned)

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

MIT License" 
