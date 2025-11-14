"""
Example demonstrating cloud agent delegation in PixelForge
"""

from cloud_agent import create_default_delegator, CloudAgent, CloudAgentDelegator, AgentType
import json


def example_basic_delegation():
    """Basic example of delegating to a cloud agent"""
    print("=== Basic Cloud Agent Delegation ===\n")
    
    # Create delegator with default agents
    delegator = create_default_delegator()
    
    # Delegate an image enhancement task
    task = {
        "image": "sample_images/photo.jpg",
        "operation": "enhance",
        "parameters": {
            "brightness": 1.2,
            "contrast": 1.1,
            "saturation": 1.05
        }
    }
    
    result = delegator.delegate_task("processor", task)
    print(f"Enhancement Result:\n{json.dumps(result, indent=2)}\n")
    
    # Delegate a filter task
    filter_task = {
        "image": "sample_images/landscape.jpg",
        "filter": "vintage",
        "intensity": 0.7
    }
    
    result = delegator.delegate_task("filter", filter_task)
    print(f"Filter Result:\n{json.dumps(result, indent=2)}\n")


def example_custom_agent():
    """Example of registering and using a custom cloud agent"""
    print("=== Custom Cloud Agent ===\n")
    
    delegator = CloudAgentDelegator()
    
    # Register a custom agent with specific endpoint
    custom_agent = CloudAgent(
        AgentType.IMAGE_PROCESSOR,
        endpoint="https://custom-processing.example.com/api/v1/process"
    )
    delegator.register_agent("custom_processor", custom_agent)
    
    # Use the custom agent
    task = {
        "image": "sample_images/portrait.jpg",
        "operation": "auto_enhance",
        "quality": "high"
    }
    
    result = delegator.delegate_task("custom_processor", task)
    print(f"Custom Agent Result:\n{json.dumps(result, indent=2)}\n")


def example_resize_delegation():
    """Example of delegating image resize operations"""
    print("=== Resize Delegation ===\n")
    
    delegator = create_default_delegator()
    
    # Delegate a resize task
    resize_task = {
        "image": "sample_images/large_photo.jpg",
        "width": 1920,
        "height": 1080,
        "maintain_aspect_ratio": True,
        "output_format": "webp"
    }
    
    result = delegator.delegate_task("resize", resize_task)
    print(f"Resize Result:\n{json.dumps(result, indent=2)}\n")


def example_composite_delegation():
    """Example of delegating composite operations"""
    print("=== Composite Delegation ===\n")
    
    delegator = create_default_delegator()
    
    # Delegate a composite task
    composite_task = {
        "layers": [
            {"image": "sample_images/background.jpg", "z_index": 0},
            {"image": "sample_images/overlay.png", "z_index": 1, "opacity": 0.8},
            {"image": "sample_images/watermark.png", "z_index": 2, "position": "bottom-right"}
        ],
        "output_format": "png"
    }
    
    result = delegator.delegate_task("composite", composite_task)
    print(f"Composite Result:\n{json.dumps(result, indent=2)}\n")


if __name__ == "__main__":
    print("PixelForge Cloud Agent Delegation Examples\n")
    print("=" * 50)
    print()
    
    example_basic_delegation()
    example_custom_agent()
    example_resize_delegation()
    example_composite_delegation()
    
    print("=" * 50)
    print("\nAll examples completed successfully!")
    print("Tasks have been delegated to cloud agents for processing.")
