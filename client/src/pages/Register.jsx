import { useRef, useState, useEffect } from "react";
import { FaCheck, FaRegTimesCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "../api/axios";

// Regex and URL...
const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const REGISTER_URL = "/api/register";

const Register = () => {
  const userRef = useRef();
  const errRef = useRef();

  const [user, setUser] = useState("");
  const [validName, setValidName] = useState(false);
  const [userFocus, setUserFocus] = useState(false);

  const [pwd, setPwd] = useState("");
  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  const [matchPwd, setMatchPwd] = useState("");
  const [validMatch, setValidMatch] = useState(false);
  const [matchFocus, setMatchFocus] = useState(false);

  const [errMsg, setErrMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    userRef.current.focus();
  }, []);
  useEffect(() => {
    setValidName(USER_REGEX.test(user));
  }, [user]);
  useEffect(() => {
    setValidPwd(PWD_REGEX.test(pwd));
    setValidMatch(pwd === matchPwd);
  }, [pwd, matchPwd]);
  useEffect(() => {
    setErrMsg("");
  }, [user, pwd, matchPwd]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!USER_REGEX.test(user) || !PWD_REGEX.test(pwd)) {
      setErrMsg("Invalid Entry");
      return;
    }
    try {
      await axios.post(REGISTER_URL, JSON.stringify({ user, pwd }), {
        headers: { "content-Type": "application/json" },
        withCredentials: true,
      });
      setUser("");
      setPwd("");
      setMatchPwd("");
      setSuccess(true);
    } catch (err) {
      if (!err?.response) setErrMsg("No Server Response");
      else if (err.response?.status === 409) setErrMsg("Username Taken");
      else setErrMsg("Registration Failed");
      errRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <section className="w-full max-w-xs min-h-[250px] flex flex-col p-4">
        {success ? (
          <>
            <h1 className="text-2xl font-bold mb-4 text-center text-black">
              Success!
            </h1>
            <p className="text-center text-base">
              <a href="/login" className="text-blue-500 hover:underline">
                Sign In
              </a>
            </p>
          </>
        ) : (
          <>
            <p
              ref={errRef}
              className={
                errMsg
                  ? "bg-pink-200 text-red-800 font-bold p-2 mb-2 rounded text-center"
                  : "absolute left-[-9999px]"
              }
              aria-live="assertive"
            >
              {errMsg}
            </p>

            <h1 className="mb-6 text-2xl font-bold text-center text-black">
              Sign up
            </h1>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-grow space-y-4"
            >
              {/* Username */}
              <div>
                <div className="mb-1">
                  <span
                    className={
                      validName ? "text-green-400 ml-2 inline-block" : "hidden"
                    }
                  >
                    <FaCheck />
                  </span>
                  <span
                    className={
                      validName || !user
                        ? "hidden"
                        : "text-red-400 ml-2 inline-block"
                    }
                  >
                    <FaRegTimesCircle />
                  </span>
                </div>
                <input
                  type="text"
                  id="username"
                  ref={userRef}
                  autoComplete="off"
                  onChange={(e) => setUser(e.target.value)}
                  required
                  aria-invalid={validName ? "false" : "true"}
                  aria-describedby="uidnote"
                  onFocus={() => setUserFocus(true)}
                  onBlur={() => setUserFocus(false)}
                  placeholder="Username"
                  className="w-full border border-black rounded-xl p-2 text-base text-black"
                />
                <p
                  id="uidnote"
                  className={
                    userFocus && user && !validName
                      ? "text-xs rounded text-red-500 px-2 mt-1"
                      : "absolute left-[-9999px]"
                  }
                >
                  4 to 24 characters.
                  <br />
                  Must begin with a letter.
                  <br />
                  Letters, numbers, underscores, hyphens allowed.
                </p>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1">
                  <span
                    className={
                      validPwd ? "text-green-400 ml-2 inline-block" : "hidden"
                    }
                  >
                    <FaCheck />
                  </span>
                  <span
                    className={
                      validPwd || !pwd
                        ? "hidden"
                        : "text-red-400 ml-2 inline-block"
                    }
                  >
                    <FaRegTimesCircle />
                  </span>
                </div>
                <input
                  type="password"
                  id="password"
                  onChange={(e) => setPwd(e.target.value)}
                  required
                  aria-invalid={validPwd ? "false" : "true"}
                  aria-describedby="pwdnote"
                  onFocus={() => setPwdFocus(true)}
                  onBlur={() => setPwdFocus(false)}
                  placeholder="Password"
                  className="w-full border border-black rounded-xl p-2 text-base text-black"
                />
                <p
                  id="pwdnote"
                  className={
                    pwdFocus && !validPwd
                      ? "text-xs rounded text-red-500 px-2 mt-1"
                      : "absolute left-[-9999px]"
                  }
                >
                  8 to 24 characters.
                  <br />
                  Must include uppercase and lowercase letters, a number and a
                  special character.
                  <br />
                  Allowed special characters:{" "}
                  <span aria-label="exclamation mark">!</span>{" "}
                  <span aria-label="at symbol">@</span>{" "}
                  <span aria-label="hashtag">#</span>{" "}
                  <span aria-label="dollar sign">$</span>{" "}
                  <span aria-label="percent">%</span>
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <div className="mb-1">
                  <span
                    className={
                      validMatch && matchPwd
                        ? "text-green-400 ml-2 inline-block"
                        : "hidden"
                    }
                  >
                    <FaCheck />
                  </span>
                  <span
                    className={
                      validMatch || !matchPwd
                        ? "hidden"
                        : "text-red-400 ml-2 inline-block"
                    }
                  >
                    <FaRegTimesCircle />
                  </span>
                </div>
                <input
                  type="password"
                  id="confirm_pwd"
                  onChange={(e) => setMatchPwd(e.target.value)}
                  value={matchPwd}
                  required
                  aria-invalid={validMatch ? "false" : "true"}
                  aria-describedby="confirmnote"
                  onFocus={() => setMatchFocus(true)}
                  onBlur={() => setMatchFocus(false)}
                  placeholder="Confirm password"
                  className="w-full border border-black rounded-xl p-2 text-base text-black"
                />
                <p
                  id="confirmnote"
                  className={
                    matchFocus && !validMatch
                      ? "text-xs rounded text-red-500 px-2 mt-1"
                      : "absolute left-[-9999px]"
                  }
                >
                  Must match the password input field.
                </p>
              </div>

              <button
                disabled={!validName || !validPwd || !validMatch}
                className={`bg-black text-white rounded-xl p-2 text-base
                ${
                  !validName || !validPwd || !validMatch
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-900"
                }
              `}
              >
                Sign Up
              </button>
            </form>

            <p className="text-base text-center mt-4">
              Already have an account?
              <span className="inline-block ml-2">
                <Link
                  to="/login"
                  className="text-base text-blue-500 hover:underline"
                >
                  Sign In
                </Link>
              </span>
            </p>
          </>
        )}
      </section>
    </div>
  );
};

export default Register;
