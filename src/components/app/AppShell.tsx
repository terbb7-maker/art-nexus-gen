import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const AppShell = ({ children, hideSidebar = false }: { children: ReactNode; hideSidebar?: boolean }) => (
  <ProtectedRoute>
    <div className="flex min-h-screen w-full">
      {!hideSidebar && <AppSidebar />}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  </ProtectedRoute>
);
