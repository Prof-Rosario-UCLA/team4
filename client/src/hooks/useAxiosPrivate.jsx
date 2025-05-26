import { axiosPrivate } from "../api/axios";
import { useEffect } from "react";
import useRefreshToken from "./useRefreshToken";
import useAuth from "./useAuth";

// This hook is used in a React app to make sure that all API requests include the correct authorization
// and automatically try to refresh tokens if the session is expired.
// This is a customized version of axios that:
//      Adds the access token to every request
//      Automatically tries to refresh to token if it expires
//      Cleans up the interceptors when not needed anymore
const useAxiosPrivate = () => {
  const refresh = useRefreshToken();
  const { auth } = useAuth();

  // This is like a checkpoint
  useEffect(() => {
    // Intercept requests before they are send
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        // If no token in the request header, add token
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${auth?.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercept response before they are processed
    const responseIntercept = axiosPrivate.interceptors.response.use(
      (response) => response, // Response OK -> Just return it
      async (error) => {
        // If request failed with 403 (access token expired) and it hasn't been retried with the new token yet -> Get a new token from the refresh endpoint and add it to the original request and resend the failed request
        const prevRequest = error?.config;
        if (error?.response?.status === 403 && !prevRequest?.sent) {
          prevRequest.sent = true;
          const newAccessToken = await refresh();
          prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return axiosPrivate(prevRequest);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
      axiosPrivate.interceptors.response.eject(responseIntercept);
    };
  }, [auth, refresh]);

  return axiosPrivate;
};

export default useAxiosPrivate;
