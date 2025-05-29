import { Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth.jsx";
import Layout from "./pages/Layout.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import AgentChatPage from "./pages/AgentChatPage.jsx";
import DiscussionPage from "./pages/DiscussionPage.jsx";
import ChatroomPage from "./pages/ChatroomPage.jsx";


function App() {

  return (
    <main className="App">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/unauthorized" element={<Unauthorized />}/> */}

        <Route path="/" element={<Layout />}>
          {/* Protected routes */}
          <Route path="agent" element={<AgentChatPage />} />
          <Route path="discussion" element={<DiscussionPage />} />
          <Route path="chatroom" element={<ChatroomPage />} />

          {/* Catch all (e.g. 404 page) */}
          {/* <Route path="*" element={<Missing />} /> */}
        </Route>
      </Routes>
    </main>
  );
}

export default App;
