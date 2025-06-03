import { useRef, useState, useEffect } from "react";
import axios from "../api/axios.js";
import useAuth from "../hooks/useAuth.jsx";
import { Link, useNavigate, useLocation } from "react-router-dom";

const LOGIN_URL = "/api/auth";

const Login = () => {
  const { setAuth } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location?.state?.from?.pathname || "/agent";

  // To make focus on user and error messages
  const userRef = useRef();
  const errRef = useRef();

  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [errMsg, setErrMsg] = useState("");

  // Automatically focus on user input field when this component load
  useEffect(() => {
    userRef.current.focus();
  }, []);

  // Claer the error messages whenever user/pwd input field changes
  useEffect(() => {
    setErrMsg("");
  }, [user, pwd]);

  const handleSubmit = async (e) => {
    // Preventing reloading the page which is a default behavior of form
    e.preventDefault();

    try {
      const response = await axios.post(
        LOGIN_URL,
        JSON.stringify({ user, pwd }),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      console.log(JSON.stringify(response?.data));

      // Store the access token
      const accessToken = response?.data?.accessToken;

      // Store username and access token in auth state
      setAuth({
        user: user, // Store username directly
        accessToken,
      });

      setUser("");
      setPwd("");
      navigate(from, { replace: true });
    } catch (err) {
      if (!err.response) {
        setErrMsg("No Server Response");
      } else if (err.response?.status === 400) {
        setErrMsg("Missing Username or Password");
      } else if (err.response?.status === 401) {
        setErrMsg("Unauthorized");
      } else {
        setErrMsg("Login Failed");
      }
      errRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <section className="w-full max-w-xs min-h-[300px] flex flex-col p-4">
        <p
          ref={errRef}
          className={
            errMsg
              ? "bg-pink-200 text-red-800 font-bold rounded p-2 text-center mb-2"
              : "absolute left-[-9999px]"
          }
          aria-live="assertive"
        >
          {errMsg}
        </p>

        <h1 className="mb-6 text-3xl font-bold text-center text-black">
          Login
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <input
            type="text"
            id="username"
            ref={userRef}
            autoComplete="off"
            onChange={(e) => setUser(e.target.value)}
            value={user}
            placeholder="Username"
            required
            className="border border-black rounded-xl p-2 mb-4 text-base"
          />
          <input
            type="password"
            id="password"
            onChange={(e) => setPwd(e.target.value)}
            value={pwd}
            placeholder="Password"
            className="border border-black rounded-xl p-2 mb-4 text-base"
          />
          <button className="bg-black text-white rounded-xl p-2 text-base">
            Sign In
          </button>
        </form>
        <p className="text-base text-center mt-4">
          Don't have an account?
          <span className="inline-block ml-2">
            <Link
              to="/register"
              className="text-base text-blue-500 hover:underline"
            >
              Sign Up
            </Link>
          </span>
        </p>
      </section>
    </div>
  );
};

export default Login;
