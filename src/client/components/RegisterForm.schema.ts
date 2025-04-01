import z from "zod";

export const RegisterFormSchema = z
    .object({
        email: z.string().email(),
        username: z.string().min(2).max(30),
        password: z.string().min(8, {
            message: "Password must be at least 8 characters.",
        }),
        confirmPassword: z.string().min(8, {
            message: "Password must be at least 8 characters.",
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });
