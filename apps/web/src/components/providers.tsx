"use client";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { NavigationProgress } from "./navigation-progress";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <NavigationProgress />
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
