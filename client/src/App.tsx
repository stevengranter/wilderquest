import "./App.css";
import { Outlet } from "react-router";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <div>
      <Outlet />
      <Toaster />
    </div>
  );
}
