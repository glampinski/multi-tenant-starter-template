import { Suspense } from "react";
import TenantAwareSignIn from "@/components/auth/TenantAwareSignIn";

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TenantAwareSignIn />
    </Suspense>
  );
}
