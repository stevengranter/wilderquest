import "./App.css";
import { Outlet } from "react-router";
import { Toaster } from "@/components/ui/toaster.js";
import {AuthProvider} from "@/hooks/useAuth.js";
import LoginStatus from "@/components/LoginStatus.js";

export default function App() {
  return (
    <AuthProvider>
      
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
