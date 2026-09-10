"use client";

import React, { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ActiveEmployeeProvider } from "@/context/ActiveEmployeeContext";
import { ToastProvider } from "@/context/ToastContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ActiveEmployeeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ActiveEmployeeProvider>
    </QueryClientProvider>
  );
}
