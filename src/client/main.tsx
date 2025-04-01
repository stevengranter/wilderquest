// External modules
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";

// React Components
import App from "./App";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import Home from "./components/pages/Home";

// Stylesheets
import "./main.css";
import Welcome from "./components/pages/Welcome";

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
