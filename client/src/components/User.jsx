import { useState, useEffect } from "react";
import axios from "../api/axios";
import useRefreshToken from "../hooks/useRefreshToken.jsx";

const Users = () => {
  const [users, setUsers] = useState();
  const refresh = useRefreshToken();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController(); // Cancel the request if the component unmounted

    const getUsers = async () => {
      try {
        const response = await axios.get("/api/user", {
            signal: controller.signal
        });
        console.log(response.data);
        isMounted && setUsers(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    getUsers();

    return () => {
        isMounted = false;
        controller.abort();
    }
  });

  return(
    <article>
      <h2>Users List</h2>
      {users?.length ? (
        <ul>
          {users.map((user, idx) => 
            <li key={idx}>{user?.username}</li>
          )}
        </ul>
      ) : (
        <p>No users to display</p>
      )}
      <button onClick={() => refresh()}>
        Refresh
        <br />
      </button>
    </article>
  );
};

export default Users;