import z from "zod";

export const DecodedTokenSchema = z.object({
    user_cuid: z.string().cuid2(),
    iat: z.number(),
    exp: z.number(),
});

export type DecodedToken = z.infer<typeof DecodedTokenSchema>;

