import io from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import useAuth from "../hooks/useAuth";

const socket = io.connect("http://localhost:3000");

const ChatRoom = () => {
  const { auth } = useAuth();
  const username = auth?.user; // Get the username from auth state

  const [room, setRoom] = useState("-1");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  // User input messages
  const send_message = () => {
    if (!input.trim()) return;
    socket.emit("chat_message", { message: input, room });
    setInput("");
  };

  // Join room handler
  const joinRoom = () => {
    if (room && username) {
      socket.emit("join_room", { username, room });
      setMessages([]);
    } else {
      console.log("Cannot join room:", { room, username });
    }
  };

  // Leave room handler
  const leaveRoom = () => {
    if (room && username) {
      socket.emit("leave_room", { username, room });
      setMessages((prev) => [
        ...prev,
        { role: "system", text: `[SYSTEM] You left room ${room}` },
      ]);
    }
  };

  //
  useEffect(() => {
    socket.on("chat_message", ({ username, message }) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: `${username}: ${message}` },
      ]);
    });

    socket.on("system_message", (msg) => {
      setMessages((prev) => [
        ...prev,
        { role: "system", text: `[SYSTEM] ${msg}` },
      ]);
    });

    socket.on("disconnect", (reason) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          text: `[SYSTEM] Disconnected from server. Trying to reconnect...`,
        },
      ]);
      console.log(`${username}'s disconnection reason: ${reason}`);
    });

    socket.on("reconnect", (attemptNumber) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          text: `[SYSTEM] Reconnected to server (attempt ${attemptNumber})`,
        },
      ]);
    });

    return () => {
      socket.off("chat_message");
      socket.off("system_message");
      socket.off("disconnect");
      socket.off("reconnect");
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <section className="flex flex-row w-full max-w-40[vw] items-center justify-evenly">
        <div>
          <input
            placeholder="Room Number..."
            onChange={(e) => setRoom(e.target.value)}
            className="border"
          />
          <button
            onClick={joinRoom}
            className="cursor-pointer hover:bg-gray-200"
          >
            Join room
          </button>
        </div>
        <div>
          <button
            onClick={leaveRoom}
            className="cursor-pointer hover:bg-gray-200"
          >
            Leave room
          </button>
        </div>
      </section>

      <fieldset className="w-[90vw] md:w-[40vw] h-[60vh] border bg-gray-300">
        <legend className="font-bold">Room {room}</legend>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={msg.role === "system" ? "text-gray-700" : ""}
          >
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </fieldset>

      <input
        placeholder="Message..."
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        className="w-full max-w-[40vw] border mt-5"
      />
      <button
        onClick={send_message}
        className="w-full max-w-[40vw] cursor-pointer hover:bg-gray-200"
      >
        Send Message
      </button>
    </div>
  );
};

export default ChatRoom;
