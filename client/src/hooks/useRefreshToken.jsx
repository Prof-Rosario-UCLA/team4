import axios from "../api/axios";
import useAuth from "./useAuth";

const useRefreshToken = () => {
  const { setAuth } = useAuth();

  // Retrieve access token from the server side and store it into memory (setAuth)
  const refresh = async () => {
    const response = await axios.get("/api/refresh", {
        withCredentials: true   // This sends the cookie with authentication
    });
    setAuth(prev => {
        console.log(JSON.stringify(prev));
        console.log(response.data.accessToken);
        return { ...prev, accessToken: response.data.accessToken }
    });
    return response.data.accessToken;
  }
  return refresh;
}

export default useRefreshToken;
