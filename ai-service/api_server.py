from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from travelAgent import get_augmented_prompt, agent, ChatHistoryAgentThread
from semantic_kernel.contents.chat_message_content import ChatMessageContent
from semantic_kernel.contents.utils.author_role import AuthorRole


from pymongo import MongoClient
import json
import os


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

THREAD_STORE = {}

@app.post("/chat")
async def chat(message: Message):
    try:
        user_input = message.message.strip()
        session_id = message.session_id

        thread = THREAD_STORE.get(session_id)
        if not thread:
            thread = ChatHistoryAgentThread()
            THREAD_STORE[session_id] = thread
        
        user_msg = ChatMessageContent(role=AuthorRole.USER, content=user_input)
        await thread._on_new_message(user_msg)

        augmented_prompt = await get_augmented_prompt(user_input)
        system_msg = ChatMessageContent(role=AuthorRole.SYSTEM, content=f"Here is relevant information: {augmented_prompt}")
        await thread._on_new_message(system_msg)

        response = await agent.get_response(messages=user_input, thread=thread)

        print("------------------------------", thread)
        count = 1
        print("LOG: ")
        async for msg in thread.get_messages():
            print(f"{count}. [Role: {msg.role.name}] Content: {msg.content}")
            count += 1
            
        return {"reply": response.message.content}

    except Exception as e:
        return {"error": str(e)}
