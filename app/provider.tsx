'use client';

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ImpersonationProvider } from "@/hooks/useImpersonation";

export function Provider(props: { children?: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class">
      <AuthProvider>
        <ImpersonationProvider>
          {props.children}
        </ImpersonationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}