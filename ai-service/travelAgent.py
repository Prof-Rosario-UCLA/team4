# -------------------------------------------------------------IMPORT------------------------------------------------------------
# THIS VERSION OF TRAVEL AGENT USES SEMANTIC KERNEL>=1.22.0

import os 
import random
import asyncio

from typing import Annotated, List
from openai import AsyncAzureOpenAI

from dotenv import load_dotenv

from semantic_kernel.kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion, AzureChatPromptExecutionSettings
from semantic_kernel.agents import ChatCompletionAgent, ChatHistoryAgentThread
from semantic_kernel.connectors.ai import FunctionChoiceBehavior
from semantic_kernel.functions import KernelArguments, kernel_function


from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import SearchIndex, SimpleField, SearchFieldDataType, SearchableField
from azure.identity import DefaultAzureCredential, InteractiveBrowserCredential

from plugins.plugin_functions import DestinationsPlugin, PromptPlugin, WeatherInfoPlugin

from pydantic import BaseModel, ValidationError, Field


# -------------------------------------------------------------Create the client and kernel------------------------------------------------------------

# Loads the .env file and connects to Azure OpenAI endpoint 
load_dotenv()

# Initializes Semantic Kernel 
kernel = Kernel()

# Creates and registers Azure OpenAI as the AI model in your kernel.
service_id = "agent"

chat_completion_service = AzureChatCompletion(
    deployment_name="gpt-4o",
    endpoint=os.environ.get("AZURE_OPENAI_ENDPOINT"),
    api_key=os.environ.get("AZURE_OPENAI_API_KEY"),
    api_version=os.environ.get("AZURE_OPENAI_API_VERSION"),
    service_id=service_id
)
kernel.add_service(chat_completion_service)


#-------------------------------------------------------------Multi Agents Set Up------------------------------------------------------------
# This is very hard to use
class SubTask(BaseModel):
    assigned_agent: str = Field(
        description="The specific agent assigned to handle this subtask.")
    task_details: str = Field(
        description="Detailed description of what needs to be done for this subtask.")

class TravelPlan(BaseModel):
    main_task: str = Field(
        description="The overall travel request from the user.")
    subtasks: List[SubTask] = Field(
        description="List of subtasks broken down from the main task, each assigned to a specialized agent.")
    


# -------------------------------------------------------------Creating the Agent------------------------------------------------------------

# Configures how the agent responds (creative, varied, and auto-chooses functions when needed).
settings = kernel.get_prompt_execution_settings_from_service_id(service_id=service_id)
assert isinstance(settings, AzureChatPromptExecutionSettings)
# settings.response_format = TravelPlan
settings.function_choice_behavior = FunctionChoiceBehavior.Auto()
#settings.max_tokens = 1000  # Increase max tokens for longer responses
#settings.temperature = 0.7  # Add some creativity to responses
#settings.top_p = 0.9  # Add top_p for better sampling
#settings.presence_penalty = 0.1  # Add presence penalty to encourage diversity

# Defines the behavior and formatting instructions of the AI agent.
AGENT_NAME = "TravelAgent"
AGENT_INSTRUCTIONS = """You are an planner agent.
    Your job is to decide which agents to run based on the user's request.
    Below are the available agents specialised in different tasks:
    - FlightBooking: For booking flights and providing flight information
    - HotelBooking: For booking hotels and providing hotel information
    - CarRental: For booking cars and providing car rental information
    - ActivitiesBooking: For booking activities and providing activity information
    - DestinationInfo: For providing information about destinations
    - DefaultAgent: For handling general requests
    Answer travel queries using the provided tools and context. 
    Compare the provided tools and context with the information in plugins. If they have different information, always prioritize the information in Plugins, instead of retrieved context. 
    Retrieved context only for very specific tasks that are highly related.
    If context is provided, do not say 'I have no context for that.'
"""

# Combines the kernel, model, and instructions to create your AI travel agent.
agent = ChatCompletionAgent(
    kernel=kernel,
    name=AGENT_NAME,
    instructions=AGENT_INSTRUCTIONS,
    arguments=KernelArguments(settings=settings),
    plugins=[DestinationsPlugin(), PromptPlugin(), WeatherInfoPlugin()]
)


# -------------------------------------------------------------Creating the Agent------------------------------------------------------------

# Initialize Azure AI Search wtih persistent storage
search_service_endpoint = os.getenv("AZURE_SEARCH_SERVICE_ENDPOINT")
search_api_key = os.getenv("AZURE_SEARCH_API_KEY")
index_name = "travel-documents"

search_client = SearchClient(
    endpoint=search_service_endpoint,
    index_name=index_name,
    credential=AzureKeyCredential(search_api_key)
)

index_client = SearchIndexClient(
    endpoint=search_service_endpoint,
    credential=AzureKeyCredential(search_api_key)
)

# Define the index schema -> A record
fields = [
    # Consist of an id and content
    SimpleField(name="id", type=SearchFieldDataType.String, key=True),
    SearchableField(name="content", type=SearchFieldDataType.String)
]

# A table(schema)
index = SearchIndex(name=index_name, fields=fields)

# Check if index already exists if not, create it
try:
    existing_index = index_client.get_index(index_name)
    print(f"Index '{index_name}' already exists, using the existing index.")
except Exception as e:
    # Create the index if it doesn't exist
    print(f"Creating new index '{index_name}'...")
    index_client.create_index(index)

# Enhanced sample documents
documents = [
    {"id": "1", "content": "Contoso Travel offers luxury vacation packages to exotic destinations worldwide."},
    {"id": "2", "content": "Our premium travel services include personalized itinerary planning and 24/7 concierge support."},
    {"id": "3", "content": "Contoso's travel insurance covers medical emergencies, trip cancellations, and lost baggage."},
    {"id": "4", "content": "Popular destinations include the Maldives, Swiss Alps, and African safaris."},
    {"id": "5", "content": "Contoso Travel provides exclusive access to boutique hotels and private guided tours."}
]

# Add documents to the index
search_client.upload_documents(documents)

def get_retrieval_context(query: str) -> str:
    results = search_client.search(query)
    context_strings = []
    for result in results:
        context_strings.append(f"Document: {result['content']}")
    return "\n\n".join(context_strings) if context_strings else "No results found"

async def get_augmented_prompt(query: str) -> str:
    retrieval_context = get_retrieval_context(query)
    return PromptPlugin.build_augmented_prompt(query, retrieval_context)

# -------------------------------------------------------------Running the Agent------------------------------------------------------------

async def main():
    # Create a thread for the conversation
    thread = ChatHistoryAgentThread()

    # Sample user inputs to simulate a conversation.
    user_inputs = [
        "What destinations are available?",
        "Is Barcelona available?",
        "Plan me a day trip.",
        "Are there any vacation destinations available not in Europe? If so, select a place and plan me another day trip.",
        "Can you explain Contoso's travel insurance coverage?",
        "What is the average temperature of the Maldives?",
        "What is a good cold destination offered by Contoso and what is it average temperature?",
        "What is Neural Network?"  # No retrieval context available.
    ]

    try:
        for user_input in user_inputs:
            print(f"\nUser: {user_input}")
            augmented_prompt = await get_augmented_prompt(user_input)
            await thread._on_new_message(
                f"Here is relevant information to help answer the user's question: {augmented_prompt}")

            # Get response using the new get_response API with thread management
            response = await agent.get_response(messages=user_input, thread=thread)
            
            # Print the response
            print(f"\n{response.name}: {response.message.content}")
            thread = response.thread
            
            
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        # Clean up thread
        await thread.delete() if thread else None


if __name__ == "__main__":
    asyncio.run(main())