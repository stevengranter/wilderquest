import z from "zod";

export const UserLoginCredentialsSchema = z.object({
      username: z.string().min(2).max(24),
      password: z.string().min(8).max(64),
    }
)

export type UserLoginCredentials = z.infer<typeof UserLoginCredentialsSchema>

const UserRegistrationDataSchema = UserLoginCredentialsSchema.extend({
  email: z.string().email().max(60),
});

export type UserRegistrationData = z.infer<typeof UserRegistrationDataSchema>;

const UserProfileWithTokenSchema = z.object({
  userId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type UserProfileWithToken = z.infer<typeof UserProfileWithTokenSchema>;
