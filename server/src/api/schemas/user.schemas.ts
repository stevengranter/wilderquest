// src/schemas/userSchemas.ts
import { z } from "zod";

export const userRegistrationSchema = z.object({
  username: z.string().max(20),
  email: z.string().email(),
  password: z.string().min(8),
});

export const userLoginSchema = z.object({
  username: z.string().max(20),
  password: z.string().min(8),
});
