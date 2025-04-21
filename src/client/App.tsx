import "./App.css";
import {Outlet} from "react-router";
import {Toaster} from "@/components/ui/toaster";
import {AuthProvider} from "@/hooks/useAuth";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ThreeFiberCanvas} from "@/components/3d/ThreeFiberCanvas";


const queryClient = new QueryClient()

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ThreeFiberCanvas/>
                <Outlet/>
                <Toaster/>
            </AuthProvider>
        </QueryClientProvider>
    );
}
