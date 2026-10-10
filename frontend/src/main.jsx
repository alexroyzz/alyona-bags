import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { UserAuthProvider } from "./context/UserAuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserAuthProvider>
          <CartProvider>
            <App />
            <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
          </CartProvider>
        </UserAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
