import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { registerSW } from 'virtual:pwa-register';
import App from "./App.jsx";
import "./index.css";

const updateSW = registerSW({
  onNeedRefresh() {
    // Show update prompt to user
    if (window.confirm('A new version is available! Would you like to update now?')) {
      updateSW()
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
