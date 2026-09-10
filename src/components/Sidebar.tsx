"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  ClipboardList,
  ShoppingCart,
  PackageCheck,
  Receipt,
  ArrowLeftRight,
  Pill,
  BookOpen,
  GitBranch,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Requisitions", href: "/requisitions", icon: ClipboardList },
  { name: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
  { name: "Goods Receipts", href: "/goods-receipts", icon: PackageCheck },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Transfers", href: "/stock-transfers", icon: ArrowLeftRight },
  { name: "Sales", href: "/sales", icon: Pill },
  { name: "Stock Ledger", href: "/stock-ledger", icon: BookOpen },
  { name: "Traceability", href: "/traceability", icon: GitBranch },
];

function SidebarNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const actingAsParam = searchParams.get("actingAs");

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        const hrefWithQuery = actingAsParam
          ? `${item.href}${item.href.includes("?") ? "&" : "?"}actingAs=${actingAsParam}`
          : item.href;

        return (
          <Link
            key={item.name}
            href={hrefWithQuery}
            className={clsx("sidebar-link", isActive && "sidebar-link-active")}
          >
            <Icon className="w-4 h-4 shrink-0 text-current" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 bg-sidebar-bg border-r border-sidebar-border flex flex-col shrink-0 h-screen sticky top-0 z-20">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-accent flex items-center justify-center text-white shrink-0">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-(--font-size-md) tracking-tight leading-tight">
              HealthPilot ERP
            </h1>
            <p className="text-[11px] text-[#CBD5E1] font-medium">
              Hospital Pharmacy Chain
            </p>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <Suspense fallback={<div className="flex-1 px-3 py-4 text-xs text-slate-400">Loading menu...</div>}>
        <SidebarNavContent />
      </Suspense>

      {/* Footer System Info */}
      <div className="p-4 border-t border-sidebar-border text-[11px] text-[#CBD5E1]">
        <p className="font-medium text-slate-300">Insulin Glargine ERP</p>
        <p className="mt-0.5 opacity-75">v1.0.0 • Production Audit</p>
      </div>
    </aside>
  );
}
