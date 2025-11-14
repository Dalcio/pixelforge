"""
Unit tests for cloud agent delegation functionality
"""

import unittest
from cloud_agent import (
    CloudAgent,
    CloudAgentDelegator,
    AgentType,
    create_default_delegator
)


class TestCloudAgent(unittest.TestCase):
    """Tests for CloudAgent class"""
    
    def test_agent_creation(self):
        """Test creating a cloud agent"""
        agent = CloudAgent(AgentType.IMAGE_PROCESSOR)
        self.assertEqual(agent.agent_type, AgentType.IMAGE_PROCESSOR)
        self.assertIsNotNone(agent.endpoint)
        
    def test_agent_custom_endpoint(self):
        """Test creating agent with custom endpoint"""
        custom_endpoint = "https://custom.example.com/api"
        agent = CloudAgent(AgentType.FILTER_AGENT, endpoint=custom_endpoint)
        self.assertEqual(agent.endpoint, custom_endpoint)
        
    def test_default_endpoints(self):
        """Test that default endpoints are set correctly"""
        agent = CloudAgent(AgentType.IMAGE_PROCESSOR)
        self.assertIn("pixelforge.cloud", agent.endpoint)
        
    def test_delegate_returns_result(self):
        """Test that delegate method returns a result"""
        agent = CloudAgent(AgentType.IMAGE_PROCESSOR)
        task = {"image": "test.jpg", "operation": "enhance"}
        result = agent.delegate(task)
        
        self.assertIn("status", result)
        self.assertIn("agent_type", result)
        self.assertEqual(result["status"], "delegated")
        

class TestCloudAgentDelegator(unittest.TestCase):
    """Tests for CloudAgentDelegator class"""
    
    def test_delegator_creation(self):
        """Test creating a delegator"""
        delegator = CloudAgentDelegator()
        self.assertEqual(len(delegator.agents), 0)
        
    def test_register_agent(self):
        """Test registering an agent"""
        delegator = CloudAgentDelegator()
        agent = CloudAgent(AgentType.IMAGE_PROCESSOR)
        delegator.register_agent("test_agent", agent)
        
        self.assertEqual(len(delegator.agents), 1)
        self.assertIn("test_agent", delegator.agents)
        
    def test_delegate_task_success(self):
        """Test delegating a task successfully"""
        delegator = CloudAgentDelegator()
        agent = CloudAgent(AgentType.IMAGE_PROCESSOR)
        delegator.register_agent("processor", agent)
        
        task = {"image": "test.jpg", "operation": "enhance"}
        result = delegator.delegate_task("processor", task)
        
        self.assertEqual(result["status"], "delegated")
        
    def test_delegate_task_unknown_agent(self):
        """Test delegating to unknown agent raises error"""
        delegator = CloudAgentDelegator()
        task = {"image": "test.jpg"}
        
        with self.assertRaises(ValueError):
            delegator.delegate_task("unknown_agent", task)
            

class TestDefaultDelegator(unittest.TestCase):
    """Tests for default delegator creation"""
    
    def test_create_default_delegator(self):
        """Test creating delegator with default agents"""
        delegator = create_default_delegator()
        
        # Should have 4 default agents
        self.assertEqual(len(delegator.agents), 4)
        
        # Check all expected agents are registered
        self.assertIn("processor", delegator.agents)
        self.assertIn("filter", delegator.agents)
        self.assertIn("resize", delegator.agents)
        self.assertIn("composite", delegator.agents)
        
    def test_default_agents_functional(self):
        """Test that default agents can delegate tasks"""
        delegator = create_default_delegator()
        
        # Test each default agent
        agents_to_test = ["processor", "filter", "resize", "composite"]
        
        for agent_name in agents_to_test:
            task = {"image": "test.jpg", "operation": "test"}
            result = delegator.delegate_task(agent_name, task)
            self.assertEqual(result["status"], "delegated")


class TestAgentTypes(unittest.TestCase):
    """Tests for AgentType enum"""
    
    def test_agent_types_exist(self):
        """Test that all expected agent types exist"""
        expected_types = [
            "IMAGE_PROCESSOR",
            "FILTER_AGENT",
            "RESIZE_AGENT",
            "COMPOSITE_AGENT"
        ]
        
        for type_name in expected_types:
            self.assertTrue(hasattr(AgentType, type_name))
            
    def test_agent_type_values(self):
        """Test agent type values are correct"""
        self.assertEqual(AgentType.IMAGE_PROCESSOR.value, "image_processor")
        self.assertEqual(AgentType.FILTER_AGENT.value, "filter_agent")
        self.assertEqual(AgentType.RESIZE_AGENT.value, "resize_agent")
        self.assertEqual(AgentType.COMPOSITE_AGENT.value, "composite_agent")


if __name__ == "__main__":
    unittest.main()
