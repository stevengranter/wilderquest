import LoginForm from "@/components/LoginForm";
import { Card } from "../ui/card";

export default function Login() {
  return (
    <div className="flex content-center justify-center p-10">
      <Card className="flex w-100 p-5">
        <LoginForm />
      </Card>
    </div>
  );
}
