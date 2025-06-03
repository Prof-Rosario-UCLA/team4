import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../hooks/useAxiosPrivate.jsx";
import useAuth from "../hooks/useAuth";
import SessionItem from "./SessionItem.jsx";
import { VscNewFile } from "react-icons/vsc";
import { FiUser, FiLogOut, FiMapPin } from "react-icons/fi";

const Sidebar = () => {
  const { auth, logout } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  /*-------------------------------------------------------------Fetch sessions------------------------------------------------------------*/
  const fetchSessions = useCallback(async () => {
    try {
      const res = await axiosPrivate.get("/api/session");
      setSessions(res.data || []);
    } catch (err) {
      console.error("Error fetching sessions: ", err);
      setSessions([]);
    }
  }, [auth?.user, axiosPrivate]);

  useEffect(() => {
    if (auth?.user) {
      fetchSessions();
    } else {
      setSessions([]);
    }
  }, [auth?.user, fetchSessions]);

  useEffect(() => {
    const handleRefreshSessions = () => {
      fetchSessions();
    };

    window.addEventListener("refreshSessions", handleRefreshSessions);
    return () => {
      window.removeEventListener("refreshSessions", handleRefreshSessions);
    };
  }, [fetchSessions]);

  /*-------------------------------------------------------------Simple Geolocation------------------------------------------------------------*/
  const getLocation = useCallback(async () => {
    try {
      // Simple IP-based location (no GPS needed)
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      setUserLocation({
        city: data.city || "Unknown",
        country: data.country_name || "Unknown"
      });
    } catch (error) {
      console.error("Location error:", error);
      setUserLocation({
        city: "Location",
        country: "Unavailable"
      });
    }
  }, []);

  useEffect(() => {
    if (showProfileModal && !userLocation) {
      getLocation();
    }
  }, [showProfileModal, userLocation, getLocation]);

  /*-------------------------------------------------------------Handlers------------------------------------------------------------*/
  const createNewChat = () => {
    navigate("/agent");
  };

  const handleProfileClick = () => {
    setShowProfileModal(!showProfileModal);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileModal(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleModalOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowProfileModal(false);
    }
  };

  /*-------------------------------------------------------------Return------------------------------------------------------------*/
  return (
    <div className="relative h-full">
      {auth?.user ? (
        <div className="flex flex-col h-full">
          <div className="p-3 py-2">
            <img src="/pwa-192x192.png" alt="App logo" className="h-10 w-10" />
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

          {/* Profile Bar */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {auth.user.name ? auth.user.name.charAt(0).toUpperCase() : <FiUser />}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">
                  {auth.user.name || auth.user.email || "User"}
                </div>
                <div className="text-xs text-gray-500">
                  {auth.user.email}
                </div>
              </div>
            </button>
          </div>

          {/* Profile Modal */}
          {showProfileModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-start z-50"
              onClick={handleModalOverlayClick}
            >
              <div className="bg-white rounded-t-lg shadow-lg w-64 ml-3 mb-20 animate-slide-up">
                <div className="p-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {auth.user.name ? auth.user.name.charAt(0).toUpperCase() : <FiUser />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {auth.user.name || "User"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {auth.user.email}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <FiMapPin className="w-4 h-4" />
                      <span>Location</span>
                    </div>
                    <div className="text-sm">
                      {userLocation ? (
                        <div className="font-medium text-gray-900">
                          {userLocation.city}, {userLocation.country}
                        </div>
                      ) : (
                        <div className="text-gray-500">Loading...</div>
                      )}
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full p-2 text-left rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div></div>
      )}

      <style jsx>{`
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
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;