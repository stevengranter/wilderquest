import "./App.css";
import { Outlet } from "react-router";
import { Toaster } from "@/components/ui/toaster";
import {AuthProvider} from "@/hooks/useAuth";
import LoginStatus from "@/components/LoginStatus.js";

export default function App() {
  return (
    <AuthProvider>

      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
