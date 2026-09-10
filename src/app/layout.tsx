import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { Sidebar } from "@/components/Sidebar";
import { EmployeeSelector } from "@/components/EmployeeSelector";
import { TopbarTitle } from "@/components/TopbarTitle";

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div className="flex h-screen overflow-hidden bg-(--color-bg)">
            {/* Persistent Left Sidebar */}
            <Sidebar />

            {/* Main Application Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
              {/* Topbar Header */}
              <header className="h-16 pl-6 pr-24 bg-surface border-b border-(--color-border) flex items-center justify-between sticky top-0 z-10 shrink-0 shadow-xs">
                {/* Page Heading */}
                <div>
                  <TopbarTitle />
                </div>

                {/* Active Employee Persona Selector */}
                <div>
                  <EmployeeSelector />
                </div>
              </header>

              {/* Page Content Container */}
              <main className="flex-1 pl-6 pr-24 py-6 min-w-0 overflow-y-auto">
                <div className="max-w-360 w-full mx-auto min-w-0">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
