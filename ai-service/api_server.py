# FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# Azure AI Agents
from travelAgent import get_augmented_prompt, agent, ChatHistoryAgentThread
from semantic_kernel.contents.chat_history import ChatHistory
from semantic_kernel.contents import ChatMessageContent
from semantic_kernel.contents.utils.author_role import AuthorRole
# Others
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv
from datetime import datetime, UTC
import json
import os
import certifi
import redis.asyncio as redis
from typing import Optional, List

# Load environment variables
load_dotenv(dotenv_path="../.env")


# -------------------------------------------------------------Database Setup------------------------------------------------------------
# MongoDB setup
mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    raise ValueError("MONGO_URI environment variable is not set")

mongo_client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
print("Successfully connected to MongoDB from AI-service")
db = mongo_client["AI-service"]
threads_collection = db["Threads"]
msg_collection = db["Messages"]

# Redis setup
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    password=os.getenv("REDIS_PASSWORD"),
    db=0,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_keepalive=True,
    health_check_interval=30,
)

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


# -------------------------------------------------------------Redis Caching Functions------------------------------------------------------------

""" Cache thread structure
thread_info:{session_id}
{
    "thread_id": "thread_xyz",
    "msg_count": 1,
    "last_updated": ISODate("...")
}
"""

""" Cache message structure
thread_msg:{thread_id}
{
    "role": "USER" | "SYSTEM" | "ASSISTANT"
    "content": "text of the message",    
    "timestamp": ISODate("..."),
}
"""

async def get_cached_thread_info(session_id: str) -> Optional[dict]:
    """Get thread info (thread_id, message_count) from cache"""
    try:
        cache_thread_info_key = f"thread_info:{session_id}"
        cached_data = await redis_client.get(cache_thread_info_key)
        
        if cached_data:
            return json.loads(cached_data.decode('utf-8'))
        
    except Exception as e:
        print(f"Cache miss for thread info: {e}")
    
    return None


async def cache_thread_info(session_id: str, thread_id: str, msg_count: int):
    """Cache  thread info"""
    try:
        cache_thread_info_key = f"thread_info:{session_id}"
        cached_data = {
            "thread_id": thread_id,
            "msg_count": msg_count,
            "last_updated": datetime.now(UTC).isoformat()
        }

        await redis_client.set(cache_thread_info_key, json.dumps(cached_data), ex=3600)

    except Exception as e:
        print(f"Failed to cache thread info: {e}")


async def get_cached_messages(thread_id: str, limit: int=50) -> Optional[List[dict]]:
    """
        Get latest messages of current thread chat history from cache. 
        50 messages by default)
    """
    try:
        cache_thread_message_key = f"thread_msg:{thread_id}"
        
        cached_data = await redis_client.get(cache_thread_message_key)
        if cached_data:
            messages = json.loads(cached_data.decode('utf-8'))
            return messages[-limit:] if len(messages) > limit else messages   
        
    except Exception as e:
        print(f"Cache miss for recent messages: {e}")
    
    return None


async def cache_messages(thread_id: str, messages: List[dict], limit: int=50):
    """
        Cache the latest 50 messages
    """
    try:
        cache_thread_message_key = f"thread_msg:{thread_id}"
        
        latest_messages = messages[-limit:] if len(messages) > limit else messages 
        
        await redis_client.set(cache_thread_message_key, json.dumps(latest_messages), ex=3600)
    
    except Exception as e:
        print(f"Failed to cache the latest messages: {e}")

# -------------------------------------------------------------Serialization & Deserialization------------------------------------------------------------
"""Stateless Thread Management"""

""" Thread structure
{
    "_id": ObjectId,
    "session_id": "abc123",
    "thread_id": "thread_xyz",
    "msg_count": 25,  
    "last_updated": ISODate("...")
    "created_at": ISODate("...")
}
"""

""" Message structure
{
    "_id": ObjectId("...")
    "thread_id": "thread_xyz",
    "role": "USER" | "SYSTEM" | "ASSISTANT"
    "content": "text of the message",    
    "items": [],
    "timestamp": ISODate("...")
}
"""


async def load_thread(session_id: str) -> ChatHistoryAgentThread:
    """
    STATELESS: Rebuild thread from recent context each time
    No persistent objects in memory - everything reconstructed per request
    """
    
    cached_thread_info = await get_cached_thread_info(session_id)
    if cached_thread_info:
        # Load thread info from cache
        thread_id = cached_thread_info["thread_id"]
    else:
        # Fallback to load thread info from database
        thread_info = threads_collection.find_one({"session_id": session_id})
        if not thread_info:
            # Create new thread for new session
            return ChatHistoryAgentThread()
        
        thread_id = thread_info["thread_id"]
        msg_count = thread_info.get("msg_count", 0)
        
        # Cache the thread info from database if its not in redis cache
        await cache_thread_info(session_id, thread_id, msg_count)
    
    # Load thread messages from cache
    latest_msgs = await get_cached_messages(thread_id, limit=50)
    
    if not latest_msgs:
        # Fallback to load thread messages from database
        cursor = msg_collection.find({ 
            "thread_id": thread_id,
            "role": {"$in": ["USER", "ASSISTANT"]}  # Only load user and assistant messages
        }).sort("timestamp", -1).limit(50)
        
        latest_docs = list(cursor)
        latest_docs.reverse()
        
        latest_msgs = []
        for doc in latest_docs:
            latest_msgs.append({
                "role": doc["role"],
                "content": doc.get("content", ""),
                "timestamp": doc.get("timestamp", datetime.now(UTC)).isoformat()
            })
        
        if latest_msgs:
            # Cache the latest messages from database to redis cahce
            await cache_messages(thread_id, latest_msgs)
    
    chat_history = ChatHistory()
    
    for msg_data in latest_msgs:
        if msg_data["role"] not in ["USER", "ASSISTANT"]:
            continue
        
        role = AuthorRole[msg_data["role"].upper()]
        content = msg_data["content"]
        
        chat_history.add_message(
            ChatMessageContent(
                role=role,
                content=content,
            )
        )
    
    return ChatHistoryAgentThread(chat_history=chat_history, thread_id=thread_id)
        

async def save_thread(session_id: str, thread: ChatHistoryAgentThread):
    """
    STATELESS: Save only the new messages added in this request
    Figure out what's new by comparing with database count
    """
    
    thread_id = thread._id
    total_msg_count = len(thread)
    
    cached_thread_info = await get_cached_thread_info(session_id)
    
    # Calculate the number of new messages
    if cached_thread_info:
        existing_msg_count = cached_thread_info["msg_count"]
    else:
        thread_doc = threads_collection.find_one({"session_id": session_id})
        existing_msg_count = thread_doc.get("msg_count", 0) if thread_doc else 0
        
    new_msg_count = total_msg_count - existing_msg_count
    
    if new_msg_count <= 0:
        # No new messages to save
        return
    
    new_msgs = []
    count = 1
    async for msg in thread.get_messages():
        if count > existing_msg_count:
            new_msgs.append(msg)
        count += 1
    
    # Save messages to database
    serialized_msgs = []
    
    for msg in new_msgs:
        items_data = []
        if msg.items:
            for item in msg.items:
                # Handle different types of content items
                if hasattr(item, '__class__'):
                    item_type = item.__class__.__name__
                else:
                    item_type = 'unknown'
                
                item_dict = {
                    "type": item_type,
                }
                
                # Extract content based on item type
                if hasattr(item, 'text'):
                    item_dict["text"] = item.text
                elif hasattr(item, 'content'):
                    item_dict["content"] = item.content
                elif hasattr(item, 'result'):
                    item_dict["result"] = str(item.result)
                else:
                    item_dict["data"] = str(item)
                
                items_data.append(item_dict)
        else:
            items_data.append({
                "type": "text",
                "text": msg.content or ""
            })
    
        msg_doc = {
            "thread_id": thread_id,
            "role": msg.role.name,
            "content": msg.content or "",
            "items": items_data,
            "timestamp": datetime.now(UTC)
        }
        serialized_msgs.append(msg_doc)
        
    if serialized_msgs:
        try:
            msg_collection.insert_many(serialized_msgs)
        except Exception as e:
            print(f"Failed to save serialized chat history messages: {e}")
            raise
    
    # Update database's thread info with new counts
    threads_collection.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "msg_count": total_msg_count,
                "last_updated": datetime.now(UTC)
            },
            "$setOnInsert": {
                "thread_id": thread_id,
                "created_at": datetime.now(UTC)
            }
        },
        upsert=True
    )
    
    # Update cached's thread_info with new counts
    await cache_thread_info(session_id, thread_id, total_msg_count)
    
    # Update cached's latest messages with new messages
    if serialized_msgs:
        # Convert to cache format
        cache_msgs = []
        for msg_doc in serialized_msgs:
            cache_msgs.append({
                "role": msg_doc["role"],
                "content": msg_doc["content"],
                "timestamp": msg_doc["timestamp"].isoformat()
            })
            
        existing_cached_msg = await get_cached_messages(thread_id) or []
        updated_msg = existing_cached_msg + cache_msgs
        
        await cache_messages(thread_id, updated_msg)
    


# -------------------------------------------------------------Main API------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    try:
        await redis_client.ping()
        print(f"Redis Connected in AI-service: {os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', 6379)}")
    except Exception as e:
        print(f"Redis connection failed in AI-service: {e}")
        
@app.on_event("shutdown")
async def shutdown_event():
    try:
        await redis_client.close()
    except Exception as e:
        print(f"Error closing Redis connection in AI-service: {e}")


@app.post("/chat")
async def chat(userMessage: Message):
    try:
        user_input = userMessage.message.strip()
        session_id = userMessage.session_id

        # Load thread
        thread = await load_thread(session_id)
        print(f"Loaded thread with ID: {thread._id}")
        
        # Augment the prompt based on user input
        augmented_prompt = await get_augmented_prompt(user_input)
        
        # Combine the augmented prompt with user input
        combined_messages = f"Here is relevant information: {augmented_prompt}\n\nUser: {user_input}"
        
        # Get AI response
        response = await agent.get_response(messages=combined_messages, thread=thread)

        # Save thread 
        await save_thread(session_id, thread)
        print("Saved thread to database")
        
        # Debug: Display chat
        print("------------------------------")
        print(f"Thread ID: {thread._id}")
        print(f"Total messages in thread: {len(thread)}")
        print("Recent messages:")
        try:
            message_count = 0
            async for msg in thread.get_messages():
                message_count += 1
                if message_count > len(thread) - 3:  # Show last 3 messages
                    print(f"  {message_count}. [Role: {msg.role.name}] Content: {msg.content[:100]}...")
        except Exception as e:
            print(f"Error while logging messages: {str(e)}")
            
        # Return to frontend for chat display
        return {"reply": response.message.content}

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        import traceback
        print("Full traceback:")
        print(traceback.format_exc())
        return {"error": str(e)}