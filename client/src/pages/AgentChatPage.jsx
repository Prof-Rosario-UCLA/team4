import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
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
  const { sessionId } = useParams();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentSession, setCurrentSession] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Custom event call
  const triggerSessionsRefresh = () => {
    window.dispatchEvent(new CustomEvent("refreshSessions"));
  };

  /*-------------------------------------------------------------Load Messages------------------------------------------------------------*/
  // Fetch all sessions and set the current session
  /*
  session:
    _id: "$session_id",
    lastMessage: { $first: "$content" },
    lastTimeStamp: { $first: "$timestamp" },
    messageCount: { $sum: 1 },
  */
  const fetchSession = async () => {
    try {
      const res = await axiosPrivate.get("/api/session");

      const session = res.data.find((s) => s.session_id === sessionId);

      setCurrentSession(session);
    } catch (err) {
      console.error("Error fetching sessions: ", err);
    }
  };

  // Fetch messages corresponding to the current session
  // Fetch messages corresponding to the current session
  const fetchMessages = async (sessionId) => {
    console.log("🔍 fetchMessages called with sessionId:", sessionId);

    if (!sessionId) {
      console.log("❌ No sessionId provided, skipping fetch");
      return;
    }

    try {
      const res = await axiosPrivate.get(`/api/chatHistory/${sessionId}`);

      setMessages(res.data || []);
      return res.data || [];
    } catch (err) {
      if (err.name === "CanceledError") {
        console.log("⏸️ Request was canceled");
        return;
      }

      console.error("❌ Error fetching messages:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url,
      });

      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log("🔒 Auth error, redirecting to login");
        navigate("/login", { state: { from: location }, replace: true });
      }

      return [];
    }
  };

  // Update current messages and section of the agentChatPage every time user changes
  useEffect(() => {
    const initializeChat = async () => {
      console.log("🚀 initializeChat function called");

      if (!auth?.user) {
        console.log("❌ No auth.user, returning early");
        return;
      }

      if (sessionId) {
        console.log("📍 SessionId exists:", sessionId);

        if (
          !hasInitialized ||
          !currentSession ||
          currentSession.session_id !== sessionId
        ) {
          try {
            await Promise.all([fetchMessages(sessionId), fetchSession()]);

            setHasInitialized(true);
          } catch (err) {
            console.error("❌ Failed to load session data:", err);
          }
        } else {
          console.log("✅ Already initialized, skipping fetch");
        }
      } else {
        console.log("🆕 No sessionId - setting up for new chat");
        setMessages([]);
        setCurrentSession(null);
        setHasInitialized(true);
      }
    };

    initializeChat();
  }, [auth?.user, sessionId]);

  // Also add this debug for the reset effect:
  useEffect(() => {
    setHasInitialized(false);
  }, [sessionId]);

  /*-------------------------------------------------------------Create new session------------------------------------------------------------*/
  const createNewSession = async (userInput) => {
    if (isCreatingSession) return null;

    setIsCreatingSession(true);

    try {
      // Pop up a modal that ask for the name of new session
      const autoSessionName =
        userInput.length > 30 ? userInput.substring(0, 30) + "..." : userInput;

      // Generate new session id
      const newSessionId = crypto.randomUUID();

      // Create new session object
      const newSession = {
        session_id: newSessionId,
        session_name: autoSessionName,
        lastTimestamp: new Date(),
        messageCount: 0,
        // user_id will be added by backend from req.user._id
      };

      // Update database
      await axiosPrivate.post("/api/session", { newSession });

      setCurrentSession(newSession);
      setHasInitialized(true);

      navigate(`/agent/${newSessionId}`, { replace: true });

      // Trigger session fetch
      triggerSessionsRefresh();

      return newSessionId;
    } catch (err) {
      console.error("Error creating new session:", err);
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  /*-------------------------------------------------------------Handle Messages------------------------------------------------------------*/
  // Send message function
  const sendMessage = async () => {
    if (!input.trim() || !auth?.user || isCreatingSession || isSending) return;

    const userMsg = { role: "user", content: input };
    const userInput = input;

    // Add messages to UI immediately
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      let activeSessionId = sessionId;

      if (!sessionId && !currentSession) {
        console.log("New session....");
        activeSessionId = await createNewSession(userInput);

        if (!activeSessionId) {
          console.error("Failed to create new session");
          setMessages((prev) => [
            ...prev,
            { role: "error", content: "Failed to create new chat session." },
          ]);
          return;
        }
        // Note: navigate() happens inside createNewSession, but we don't wait for re-render
        // We use the returned session ID to continue processing immediately
        // The component will re-render after the function completed, and later with updated useParams
      }

      // Ensure that session's name has a fallback
      const sessionName =
        currentSession?.session_name ||
        (userInput.length > 30
          ? userInput.substring(0, 30) + "..."
          : userInput);

      // Save user message to MongoDB
      await axiosPrivate.post("/api/chatHistory", {
        ...userMsg,
        session_id: activeSessionId,
        session_name: sessionName,
      });

      // Send message to AI agent
      const res = await axios.post("http://localhost:8000/chat", {
        message: userInput,
        session_id: activeSessionId,
      });

      if (!res.data || !res.data.reply) {
        throw new Error("Invalid response from AI service");
      }

      const botMsg = { role: "agent", content: res.data.reply };

      // Save agent message to MongoDB
      await axiosPrivate.post("/api/chatHistory", {
        ...botMsg,
        session_id: activeSessionId,
        session_name: sessionName,
      });

      setMessages((prev) => [...prev, botMsg]);

      // Trigger session fetch
      triggerSessionsRefresh();
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        { role: "error", content: "Failed to connect to AI arguments." },
      ]);
    } finally {
      setIsSending(false);
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
    <div
      className={`w-full mx-auto ${
        !sessionId ? "h-full flex flex-col items-center justify-center" : "max-w-3xl"
      }`}
    >
      {sessionId ? (
        // Existing chat interface when sessionId exists
        <>
          {auth?.user ? (
            <div style={{ paddingBottom: `${bottomPadding}px` }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  } mb-4`}
                >
                  <div
                    className={`${
                      msg.role === "user"
                        ? "bg-gray-200 my-3 py-2 px-4 rounded-4xl"
                        : ""
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div className="w-full flex min-h-[30vh] items-center justify-center font-bold text-lg md:text-xl ">
              <p>Sign in to start chatting with the Travel Agent!</p>
            </div>
          )}

          <UserInputBox
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the travel agent..."
            message={sendMessage}
            textareaRef={textareaRef}
          />
        </>
      ) : (
        // Centered layout when no sessionId
        <div className="flex flex-col items-center justify-center space-y-6 -mt-70 w-full px-5">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl text-gray-800 mb-2">
              Ask me anything about your travel plans!
            </h3>
          </div>

          <div className="w-full max-w-3xl">
            <UserInputBox
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the travel agent..."
              message={sendMessage}
              textareaRef={textareaRef}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentChatPage;
