import { useState, useEffect } from "react";

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true); // Default to true
  
  useEffect(() => {
    // Simple network check that works in production
    const checkConnection = async () => {
      try {
        // Try to fetch from your API endpoint instead
        await fetch('/api/health', { 
          method: 'HEAD',
          mode: 'no-cors' 
        });
        setIsOnline(true);
      } catch (error) {
        // Only set offline if navigator.onLine is also false
        if (!navigator.onLine) {
          setIsOnline(false);
        }
        console.log("Error message from checkConnection for network status: ", error);
      }
    };
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    // Initial check
    checkConnection();
    
    // Check every 30 seconds instead of 5
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  return isOnline;
};