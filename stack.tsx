import "server-only";

import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: "/dashboard",
    afterSignUp: "/welcome", // New users go to welcome page first
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
  }
});
