import LoginForm from "../LoginForm.tsx";
import { Card } from "@/components/ui/card.tsx";

export default function Login() {
  return (
    <div className="flex content-center justify-center p-10">
      <Card className="flex w-100 p-5">
        <LoginForm />
      </Card>
    </div>
  );
}
