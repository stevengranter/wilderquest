// External modules
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";

// React Components
import App from "./App.tsx";
import Login from "./components/pages/Login.tsx";
import Register from "./components/pages/Register.tsx";
import Home from "./components/pages/Home.tsx";

// Stylesheets
import "./main.css";
import Welcome from "@/components/pages/Welcome.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>

    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>

          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="welcome" element={<Welcome />}/>

        </Route>
      </Routes>
    </BrowserRouter>

  </React.StrictMode>,
);
