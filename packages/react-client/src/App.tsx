import "./App.css";
import { Outlet } from "react-router";
import { Toaster } from "@/components/ui/toaster.tsx";
import { UserProvider } from '@/hooks/useAuth.tsx'

export default function App() {
  return (
    <UserProvider>
      <Outlet />
      <Toaster />
    </UserProvider>
  );
}
