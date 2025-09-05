import { Suspense } from "react";
import TenantAwareSignUp from "@/components/auth/TenantAwareSignUp";

export default function SignUp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TenantAwareSignUp />
    </Suspense>
  );
}
