import "./App.css";
import { Outlet } from "react-router";
import { Toaster } from "@/components/ui/toaster.tsx";

export default function App() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
