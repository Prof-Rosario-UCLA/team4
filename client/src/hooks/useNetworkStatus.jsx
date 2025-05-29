import { useState, useEffect } from "react";

export const useNetworkStatus = () => {
  // Navigator is a global object contains information about the user's browser and operating system.
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Manually fetching the icon is possible to determine the network connection
    
    const checkConnection = async () => {
        try {
            await fetch('/favicon.ico', {method: 'HEAD', cache: 'no-store' });
            if (navigator.onLine)
                setIsOnline(true);
            else
                setIsOnline(false);
        } catch {
            setIsOnline(false);
        }
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // When the browser detects the network is online/offline, update the isOnline state.
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    // Remove even listeners to prevent memory leaks and avoid having multi-listeners 
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  console.log("NETWORK: ", isOnline);
  return isOnline;
};
