import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import NavBar from "./components/NavBar";

export const metadata: Metadata = {
  title: "My Music | Dylan Lewis",
  description: "Browse, search, and manage the CST-391 album collection.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-body-tertiary">
        <Suspense><NavBar /></Suspense>
        {children}
      </body>
    </html>
  );
}
