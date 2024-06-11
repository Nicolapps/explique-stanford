"use client";

import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Explique</title>
      </head>
      <body className="bg-slate-100 antialiased">
        <SessionProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </SessionProvider>

        <Toaster richColors expand position="top-right" />
      </body>
    </html>
  );
}
