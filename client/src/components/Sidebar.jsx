import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate.jsx";
import useAuth from "../hooks/useAuth";
import SessionItem from "./SessionItem.jsx";
import { VscNewFile } from "react-icons/vsc";
import { FiUser, FiLogOut, FiMapPin } from "react-icons/fi";

const Sidebar = () => {
  const { auth, setAuth } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isClosingProfileModal, setIsClosingProfileModal] = useState(false);
  const [location, setLocation] = useState("");

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

  /*-------------------------------------------------------------Profile button------------------------------------------------------------*/
  const closeModal = () => {
    if (isClosingProfileModal) return;
    
    setIsClosingProfileModal(true);
    setTimeout(() => {
      setShowProfileModal(false);
      setIsClosingProfileModal(false);
    }, 200);
  };

  const handleLogout = () => {
    setAuth({});
    closeModal();
  };

  useEffect(() => {
    if (showProfileModal && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );

            const data = await response.json();
            setLocation(`${data.city}, ${data.countryName}`);
          } catch (err) {
            console.error("Error occurred in fetching location: ", err);
            setLocation("Location unavailable");
          }
        },
        () => setLocation("Location unavailable")
      );
    }
  }, [showProfileModal]);

  /*-------------------------------------------------------------Return------------------------------------------------------------*/
  return (
    <div className="relative h-full">
      {auth?.user ? (
        <div className="flex flex-col h-full">
          <section className="flex flex-col flex-1">
            <div className="p-3 py-2 justify-between">
              <img
                src="/pwa-192x192.png"
                alt="App logo"
                className="h-10 w-10"
              />
            </div>

            <button
              className="flex mx-2 px-3 py-2 mt-5 text-left rounded-4xl items-center gap-3 hover:bg-gray-300 cursor-pointer"
              onClick={createNewChat}
            >
              <VscNewFile className="w-4 h-4" />
              New Chat
            </button>

            <div className="flex-1 overflow-y-auto">
              {sessions.map((session) => (
                <SessionItem
                  key={session.session_id}
                  sessionName={session.session_name}
                  onSelect={() => navigate(`/agent/${session.session_id}`)}
                />
              ))}
            </div>
          </section>

          {/* Profile Bar */}
          <section className="p-3 border-t border-gray-200">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {auth.user?.charAt(0).toUpperCase() || <FiUser />}
              </div>
              <div className=" flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">
                  {auth.user || "User"}
                </div>
              </div>
            </button>
          </section>

          {showProfileModal && (
            <section
              onClick={() => closeModal()}
              className="fixed inset-0 flex items-end justify-start z-50"
            >
              <section
                onClick={(e) => e.stopPropagation()}
                className={`bg-white rounded-2xl shadow-lg w-64 ml-3 mb-20 p-4 modal-content ${
                  isClosingProfileModal ? 'closing' : 'opening'
                }`}
              >
                {/* User info */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-white font-medium">
                    {auth.user ? auth.user.charAt(0).toUpperCase() : <FiUser />}
                  </div>
                  <div className="font-medium text-gray-900">
                    {auth.user || "User"}
                  </div>
                </div>

                {/* Location */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FiMapPin className="w-4 h-4" />
                    <span>Location</span>
                  </div>

                  <div className="text-sm">
                    {location ? (
                      <div className="font-medium text-gray-900">
                        {location}
                      </div>
                    ) : (
                      <div className="text-gray-500">Loading...</div>
                    )}
                  </div>
                </div>

                {/* Logout button*/}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full p-2 text-left rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </section>
            </section>
          )}
        </div>
      ) : (
        <div></div>
      )}

      <style jsx>
        {`
          .modal-content {
            transform: translateY(0);
            opacity: 1;
            transition: transform 0.2s ease-out, opacity 0.2s ease-out;
          }

          .modal-content.closing {
            transform: translateY(100%);
            opacity: 0;
          }

          .modal-content.opening {
            animation: slide-up 0.2s ease-out;
          }

          @keyframes slide-up {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Sidebar;
