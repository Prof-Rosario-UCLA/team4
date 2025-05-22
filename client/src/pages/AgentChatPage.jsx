import { useState, useEffect, useRef } from "react";
import axios from "axios";
import UserInputBox from "../components/userInputBox";
import useAuth from "../hooks/useAuth";
import Users from "../components/User.jsx"

const AgentChatPage = () => {
  const { auth } = useAuth();
  /*-------------------------------------------------------------Handle Messages------------------------------------------------------------*/
  const [messages, setMessages] = useState(() => {
    // Load from localStorage or start with empty array
    const saved = localStorage.getItem("agentChatMessages");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  /* Store messages on local storage*/
  useEffect(() => {
    localStorage.setItem("agentChatMessages", JSON.stringify(messages));
  }, [messages]);

  // Send message function
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    try {
      const sessionId =
        localStorage.getItem("session_id") ||
        (() => {
          const id = crypto.randomUUID();
          localStorage.setItem("session_id", id);
          return id;
        })();
      const res = await axios.post("http://localhost:8000/chat", {
        message: input,
        session_id: sessionId,
      });
      const botMsg = { role: "agent", content: res.data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "error", content: "Failed to connect to AI arguments." },
      ]);
    }
  };

  // Set dynamic padding based on the height of the user input box
  const textareaRef = useRef(null);
  const [bottomPadding, setBottomPadding] = useState(144);

  useEffect(() => {
    if (textareaRef.current) {
      const height = textareaRef.current.scrollHeight;
      console.log("HEIGHT: ", height);
      if (height <= 240) {
        setBottomPadding(144 + height);
      } else {
        setBottomPadding(144 + 280);
      }
    }
  }, [input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, bottomPadding]);

  /* -------------------------------------------------------------Return function------------------------------------------------------------*/
  return (
    <div className="w-full max-w-3xl mx-auto">
      {auth?.user && (
        <div style={{ paddingBottom: `${bottomPadding}px` }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{ textAlign: msg.role === "user" ? "right" : "left" }}
            >
              <p>
                <strong>{msg.role}:</strong> {msg.content}
              </p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
      <UserInputBox
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        placeholder="Ask the travel agent..."
        message={sendMessage}
        textareaRef={textareaRef}
      />
      <Users />
    </div>
  );
};

export default AgentChatPage;
