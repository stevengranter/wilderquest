import RegisterForm from "@/components/RegisterForm.tsx";
import { Card } from "@/components/ui/card.tsx";

export default function Register() {
  return (
    <div className="flex content-center justify-center p-10">
      <Card className="flex p-5">
        <RegisterForm />
      </Card>
    </div>
  );
}
