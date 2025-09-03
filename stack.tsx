import "server-only";

import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: "/dashboard",
    afterSignUp: "/welcome",
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
    emailVerification: "/handler/email-verification",
    passwordReset: "/handler/password-reset",
    forgotPassword: "/handler/forgot-password",
  }
});
