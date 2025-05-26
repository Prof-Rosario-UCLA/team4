import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import useAxiosPrivate from "../hooks/useAxiosPrivate.jsx";
import UserInputBox from "../components/userInputBox";
import useAuth from "../hooks/useAuth";

const AgentChatPage = () => {
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Debug auth state
  useEffect(() => {
    console.log("Current auth state:", auth);
  }, [auth]);

  /*-------------------------------------------------------------Handle Messages------------------------------------------------------------*/
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Load chat history
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchMessages = async () => {
      try {
        console.log("Fetching messages with auth:", auth);
        const res = await axiosPrivate.get("/api/chatHistory", {
          signal: controller.signal,
        });
        console.log("Chat history response:", res);
        if (isMounted) {
          setMessages(res.data || []);
        }
      } catch (err) {
        if (err.name === "CanceledError") {
          console.log("Request was canceled");
          return;
        }
        console.error("Error fetching messages:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/login", { state: { from: location }, replace: true });
        }
      }
    };

    if (auth?.user) {
      fetchMessages();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [auth, axiosPrivate, location, navigate]);

  // Send message function
  const sendMessage = async () => {
    if (!input.trim() || !auth?.user) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      // Session_id to differential each chatHistory (Will be use in future)
      const session_id =
        localStorage.getItem("session_id") ||
        (() => {
          const id = crypto.randomUUID();
          localStorage.setItem("session_id", id);
          return id;
        })();

      // Save user message to MongoDB
      await axiosPrivate.post("/api/chatHistory", { ...userMsg, session_id });

      // Send message to AI agent
      const res = await axios.post("http://localhost:8000/chat", {
        message: input,
        session_id,
      });
      const botMsg = { role: "agent", content: res.data.reply };

      // Save agent message to MongoDB
      await axiosPrivate.post("/api/chatHistory", { ...botMsg, session_id });

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Error sending message:", err);
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
      {auth?.user ? (
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
      ) : (
        <p>No user log in!!</p>
      )}

      <UserInputBox
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        placeholder="Ask the travel agent..."
        message={sendMessage}
        textareaRef={textareaRef}
      />
      {/*<Users />*/}
    </div>
  );
};

export default AgentChatPage;
