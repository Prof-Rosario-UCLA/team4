import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate.jsx";
import useAuth from "../hooks/useAuth";
import SessionItem from "./SessionItem.jsx";
import { VscNewFile } from "react-icons/vsc";

const Sidebar = () => {
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  /*-------------------------------------------------------------Fetch sessions------------------------------------------------------------*/
  // Fetch all the sessions on sidebar
  const fetchSessions = useCallback(async () => {
    try {
      const res = await axiosPrivate.get("/api/session");

      setSessions(res.data || []);
    } catch (err) {
      console.error("Error fetching sessions: ", err);
      setSessions([]);
    }
  }, [auth?.user, axiosPrivate]);

  // Fetch sessions -> Handle user changes
  useEffect(() => {
    if (auth?.user) {
      console.log("User exists, fetch sessions");
      fetchSessions();
    } else {
      setSessions([]);
      console.log("User NOT exists, not fetching sessions");
    }
  }, [auth?.user, fetchSessions]);

  // Fetch sessions -> Listen for custom refresh session event
  useEffect(() => {
    const handleRefreshSessions = () => {
      fetchSessions();
    };

    window.addEventListener("refreshSessions", handleRefreshSessions);

    return () => {
      window.removeEventListener("refreshSessions", handleRefreshSessions);
    };
  }, [fetchSessions]);

  // Create a new chat
  const createNewChat = async () => {
    navigate("/agent");
  };

  /*-------------------------------------------------------------Return------------------------------------------------------------*/
  return (
    <div>
      {auth?.user ? (
        <div className="flex flex-col">
          <div className="p-3 py-2 justify-between">
            <img src="/pwa-192x192.png" alt="App logo" className="h-10 w-10" />
          </div>
          <button
            className="flex mx-2 px-3 py-2 mt-5 text-left rounded-4xl items-center gap-3 hover:bg-gray-300 cursor-pointer"
            onClick={createNewChat}
          >
            <VscNewFile className="w-4 h-4" />
            New Chat
          </button>
          <div className="flex-1 ">
            {sessions.map((session) => (
              <SessionItem
                key={session.session_id}
                sessionName={session.session_name}
                onSelect={() => navigate(`/agent/${session.session_id}`)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default Sidebar;
