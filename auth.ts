import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./lib/db";
import { users } from "./lib/schema";
import { eq } from "drizzle-orm";
import { parse, object, string, email, minLength, pipe } from "valibot";
import { authConfig } from "./auth.config";

const LoginSchema = object({
    email: pipe(string(), email()),
    password: pipe(string(), minLength(6)),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials) => {
                try {
                    // @ts-ignore
                    const { email, password } = parse(LoginSchema, credentials);

                    const [user] = await db
                        .select()
                        .from(users)
                        .where(eq(users.email, email))
                        .limit(1);

                    if (!user) {
                        return null;
                    }

                    const passwordsMatch = await compare(password, user.password);

                    if (!passwordsMatch) {
                        return null;
                    }

                    return {
                        ...user,
                        id: user.id.toString(),
                    };
                } catch (error) {
                    return null;
                }
            },
        }),
    ],
});
