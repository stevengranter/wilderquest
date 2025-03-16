import LoginForm from "../LoginForm";
import { Card } from "@/components/ui/card";

export default function Login() {
  return (
    <div className="flex content-center justify-center p-10">
      <Card className="flex w-100 p-5">
        <LoginForm />
      </Card>
    </div>
  );
}
