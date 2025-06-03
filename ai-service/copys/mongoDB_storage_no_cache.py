# FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# Azure AI Agents
from travelAgent import get_augmented_prompt, agent, ChatHistoryAgentThread
from semantic_kernel.contents.chat_message_content import ChatMessageContent
from semantic_kernel.contents.utils.author_role import AuthorRole
from semantic_kernel.contents.text_content import TextContent
# Others
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv
from datetime import datetime, UTC
import json
import os
import certifi
import asyncio

# Load environment variables
load_dotenv()

# MongoDB setup
mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    raise ValueError("MONGO_URI environment variable is not set")

mongo_client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
print("Successfully connected to MongoDB from AI-service")
db = mongo_client["AI-service"]
threads_collection = db["Threads"]
msg_collection = db["Messages"]

# API setup
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Replace * later with specific domain name
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class Message(BaseModel):
    message: str
    session_id: str

# -------------------------------------------------------------Serialize & Deserialize------------------------------------------------------------

""" Thread structure
{
    "_id": ObjectId,
    "session_id": "abc123",
    "thread_id": "thread_xyz",
    "last_updated": ISODate("...")
}
"""

""" Message structure
{
    "_id": ObjectId,
    "timestamp": ISODate("..."),
    "thread_id": "thread_xyz",
    "role": "USER" | "SYSTEM" | "ASSISTANT"
    "content": "text of the message",    
    "items": []
}
"""

async def save_thread(session_id: str, thread: ChatHistoryAgentThread):
    thread_id = thread._id
    messages = []

    async for msg in thread.get_messages():
        # Convert metadata to a serializable format

        messages.append({
            "thread_id": thread_id,
            "timestamp": datetime.now(UTC),
            "role": msg.role.name,
            "content": msg.content,
            "items": [
                {
                    "type": item.content_type,
                    "text": getattr(item, "text", None)  # only for TextContent
                }
                for item in msg.items
            ]
        })

    threads_collection.update_one(
        {"session_id": session_id},
        {"$set": {
            "thread_id": thread_id,
            "last_updated": datetime.now(UTC)
        }},
        upsert=True
    )

    # Overwrite existing messages for this thread
    msg_collection.delete_many({"thread_id": thread_id})
    if messages:
        msg_collection.insert_many(messages)


async def load_thread(session_id: str) -> ChatHistoryAgentThread:
    thread_meta = threads_collection.find_one({"session_id": session_id})
    if not thread_meta:
        return ChatHistoryAgentThread()

    thread_id = thread_meta["thread_id"]
    thread = ChatHistoryAgentThread(thread_id=thread_id)

    cursor = msg_collection.find({"thread_id": thread_id}).sort("timestamp", ASCENDING)
    for doc in cursor:
        role = AuthorRole[doc["role"].upper()]
        content = doc.get("content", "")
        items = []

        for item in doc.get("items", []):
            if item["type"] == "text":
                items.append(TextContent(text=item["text"]))

        msg = ChatMessageContent(
            role=role,
            content=content,
            items=items,
        )

        await thread._on_new_message(msg)

    return thread



# -------------------------------------------------------------Main API------------------------------------------------------------

@app.post("/chat")
async def chat(userMessage: Message):
    try:
        user_input = userMessage.message.strip()
        session_id = userMessage.session_id

        thread = await load_thread(session_id)
        print(f"Loaded thread with ID: {thread._id}")
        
        user_msg = ChatMessageContent(role=AuthorRole.USER, content=user_input)
        await thread._on_new_message(user_msg)
        print("Added user message to thread")

        augmented_prompt = await get_augmented_prompt(user_input)
        system_msg = ChatMessageContent(role=AuthorRole.SYSTEM, content=f"Here is relevant information: {augmented_prompt}")
        await thread._on_new_message(system_msg)
        print("Added system message to thread")

        response = await agent.get_response(messages=user_input, thread=thread)
        print("Got response from agent")

        await save_thread(session_id, thread)
        print("Saved thread to database")
        
        print("------------------------------")
        print("Thread ID:", thread._id)
        print("LOG: ")
        try:
            messages = []
            async for msg in thread.get_messages():
                messages.append(msg)
            
            if not messages:
                print("No messages found in thread")
            else:
                for i, msg in enumerate(messages, 1):
                    print(f"{i}. [Role: {msg.role.name}] Content: {msg.content}")
        except Exception as e:
            print(f"Error while logging messages: {str(e)}")
            
        return {"reply": response.message.content}

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        import traceback
        print("Full traceback:")
        print(traceback.format_exc())
        return {"error": str(e)}