'use client';

import { ThemeProvider } from "next-themes";
import { ImpersonationProvider } from "@/hooks/useImpersonation";

export function Provider(props: { children?: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class">
      <ImpersonationProvider>
        {props.children}
      </ImpersonationProvider>
    </ThemeProvider>
  );
}