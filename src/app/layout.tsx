import type { Metadata } from "next";
import "./globals.css";
import { EmployeeProvider } from "@/components/EmployeeContext";

export const metadata: Metadata = {
  title: "HealthPilot ERP - Hospital Pharmacy Management",
  description: "Hospital Pharmacy & Supply Chain ERP System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-900 text-slate-100 min-h-screen">
        <EmployeeProvider>{children}</EmployeeProvider>
      </body>
    </html>
  );
}
