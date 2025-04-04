import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button.js";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.js";
import { Input } from "@/components/ui/input.js";
import React from "react";
import { Link, useNavigate } from "react-router";
import {useAuth} from "@/hooks/useAuth.js";
import {createNameId} from "mnemonic-id";
import {LoginRequestSchema} from "@shared/schemas/Auth.js";

const LoginForm = React.forwardRef(() => {
  const navigate = useNavigate();
  const {login}= useAuth();


  const form = useForm<z.infer<typeof LoginRequestSchema>>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof LoginRequestSchema>) {
      const response = await login(values)
      navigate("/welcome");
    }

  return   (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 font-bold"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <div>
                <FormControl>
                  <div>
                    <Input placeholder={createNameId({capitalize:true, delimiter:''})} {...field} />
                  </div>
                </FormControl>
              </div>
              <FormDescription>Please enter your username</FormDescription>
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
                    <Input type="password" placeholder="" {...field} />
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
