import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AppNav } from "@/modules/shared/AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "My NDIS Portal",
  description: "NDIS Invoice Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AntdRegistry>
          {/* TODO: once auth/login is built, move AppNav into a route-group
              layout scoped to authenticated pages so /login stays nav-free. */}
          <AppNav />
          <main className="flex-1">{children}</main>
        </AntdRegistry>
      </body>
    </html>
  );
}