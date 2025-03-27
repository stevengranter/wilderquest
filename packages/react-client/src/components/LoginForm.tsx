import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button.tsx";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import React from "react";
import { Link, useNavigate } from "react-router";
import useAuth from "@/hooks/useAuth.tsx";
import { useToast } from "@/hooks/use-toast.ts";
// import { toast } from "@/hooks/use-toast";

const LoginForm = React.forwardRef(() => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { toast } = useToast();

  const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(JSON.stringify(values));
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: values.email,
        password: values.password,
      }),
    });

    console.log(res)

    toast({
        title: (res.ok) ? "Success" : "Error",
        description: res.status + " " + res.statusText
      });
    if (res.ok) {
      const {user, accessToken, refreshToken,} = await res.json();
      auth.login(user, accessToken, refreshToken)
      // console.log(accessToken)
      navigate("/welcome")
    }



  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 font-bold"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <div>
                <FormControl>
                  <div>
                    <Input placeholder="" {...field} />
                  </div>
                </FormControl>
              </div>
              <FormDescription>Please enter your email address</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <div>
                <FormControl>
                  <div>
                    <Input placeholder="" {...field} />
                  </div>
                </FormControl>
              </div>
              <FormDescription>Please enter a password</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
        <div>
          Not registered?&nbsp;
          <Link to="/register">Register here</Link>
        </div>
      </form>
    </Form>
  );
});

LoginForm.displayName = "LoginForm";
export default LoginForm;
