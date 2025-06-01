import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate.jsx";
import useAuth from "../hooks/useAuth";
import SessionItem from "./SessionItem.jsx";

const Sidebar = () => {
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  /*-------------------------------------------------------------Load Messages------------------------------------------------------------*/
  useEffect(() => {
    if (auth?.user) {
      console.log("User exists, fetch sessions");
      fetchSessions();
    } else {
      console.log("User NOT exists, not fetching sessions");
    }
  }, [auth?.user]);

  const fetchSessions = async () => {
    try {
      const res = await axiosPrivate.get("/api/session");

      console.log("Full response:", res); // ✅ See full response
      console.log("Response status:", res.status); // ✅ Check status
      console.log("Response data:", res.data); // ✅ Check data
      console.log("Type of data:", typeof res.data); // ✅ Check type
      console.log("Is data array?", Array.isArray(res.data)); // ✅ Check if array
      setSessions(res.data || []);
    } catch (err) {
      console.error("Error fetching sessions: ", err);
    }
  };

  const createNewChat = async () => {
    navigate("/agent");
  };

  return (
    <div>
      {auth?.user ? (
        <div className="flex flex-col">
          <div>
            <button onClick={createNewChat}>New Chat</button>
          </div>
          <div className="flex-1">
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
