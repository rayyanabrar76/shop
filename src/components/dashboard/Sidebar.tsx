"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SignOutButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart2,
  Settings,
  Store,
  LogOut,
  Plus,
  ChevronsUpDown,
  Palette,
  Eye,
  Tag,
  CreditCard,
  Truck,
  Sparkles,
} from "lucide-react";

type StoreItem = {
  id: string;
  name: string;
  subdomain: string;
};

type Props = {
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  stores: StoreItem[];
};

function getStoreNav(storeId: string) {
  return [
    { label: "Overview",      href: `/dashboard/stores/${storeId}`,                  icon: LayoutDashboard, exact: true },
    { label: "Products",      href: `/dashboard/stores/${storeId}/products`,          icon: Package },
    { label: "Categories",    href: `/dashboard/stores/${storeId}/categories`,        icon: Tag },
    { label: "Orders",        href: `/dashboard/stores/${storeId}/orders`,            icon: ShoppingBag },
    { label: "Customers",     href: `/dashboard/stores/${storeId}/customers`,         icon: Users },
    { label: "Analytics",     href: `/dashboard/stores/${storeId}/analytics`,         icon: BarChart2 },
    { label: "Customization", href: `/dashboard/stores/${storeId}/theme`,             icon: Palette },
    { label: "Discounts",     href: `/dashboard/stores/${storeId}/discounts`,         icon: Truck },
    { label: "Payments",      href: `/dashboard/stores/${storeId}/settings/payments`, icon: CreditCard },
    { label: "Billing",       href: `/dashboard/stores/${storeId}/settings/billing`,  icon: Sparkles },
    { label: "Settings",      href: `/dashboard/stores/${storeId}/settings`,          icon: Settings },
  ];
}

export default function Sidebar({ firstName, lastName, email, imageUrl, stores }: Props) {
  const pathname = usePathname();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const activeStoreId =
    pathname.match(/\/dashboard\/stores\/([^/]+)/)?.[1] ?? stores[0]?.id ?? "";
  const activeStore = stores.find((s) => s.id === activeStoreId) ?? stores[0];
  const navItems = activeStore ? getStoreNav(activeStore.id) : [];

  const isNavActive = (href: string, exact?: boolean, label?: string) => {
    if (label === "Settings") return pathname === href || (pathname.startsWith(href) && !pathname.includes("/settings/payments") && !pathname.includes("/settings/billing"));
    if (label === "Payments") return pathname.startsWith(href);
    if (label === "Billing") return pathname.startsWith(href);
    return exact ? pathname === href : pathname.startsWith(href);
  };

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40 select-none"
      style={{
        background: "var(--admin-bg)",
        borderRight: "1px solid var(--admin-border)",
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-2.5 px-5 h-15 shrink-0"
        style={{ borderBottom: "1px solid var(--admin-divider)" }}
      >
        <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
          <Store className="w-3.5 h-3.5 text-white" />
        </div>
        <span
          className="font-semibold text-[15px] tracking-tight"
          style={{ color: "var(--admin-text)" }}
        >
          ShopFlow
        </span>
      </div>

      {/* ── Store Switcher ── */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        {stores.length === 0 ? (
          <Link href="/dashboard/create-store">
            <button
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: "var(--admin-bg-subtle)",
                border: "1px dashed var(--admin-border)",
                color: "var(--admin-text-3)",
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Create your first store
            </button>
          </Link>
        ) : (
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen((v) => !v)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left"
              style={{
                background: "var(--admin-bg-subtle)",
                border: "1px solid var(--admin-border)",
              }}
            >
              <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {activeStore?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: "var(--admin-text)" }}>
                  {activeStore?.name}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--admin-text-3)" }}>
                  {activeStore?.subdomain}
                </p>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--admin-text-4)" }} />
            </button>

            <AnimatePresence>
              {switcherOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.13 }}
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
                  style={{
                    background: "var(--admin-bg)",
                    border: "1px solid var(--admin-border)",
                    boxShadow: "var(--admin-shadow-lg)",
                  }}
                >
                  {stores.map((store) => (
                    <div key={store.id} className="relative group">
                      <Link href={`/dashboard/stores/${store.id}`} onClick={() => setSwitcherOpen(false)}>
                        <div
                          className="flex items-center gap-2.5 px-3 py-2.5 pr-10 transition-colors"
                          style={{ background: store.id === activeStoreId ? "var(--admin-bg-muted)" : undefined }}
                          onMouseEnter={(e) => {
                            if (store.id !== activeStoreId)
                              (e.currentTarget as HTMLElement).style.background = "var(--admin-bg-subtle)";
                          }}
                          onMouseLeave={(e) => {
                            if (store.id !== activeStoreId)
                              (e.currentTarget as HTMLElement).style.background = "";
                          }}
                        >
                          <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {store.name[0]?.toUpperCase()}
                          </div>
                          <p className="flex-1 text-[12px] font-medium truncate" style={{ color: "var(--admin-text)" }}>
                            {store.name}
                          </p>
                        </div>
                      </Link>

                      <Link
                        href={`/store/${store.subdomain}`}
                        target="_blank"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all"
                        style={{ color: "var(--admin-text-3)" }}
                        onClick={(e) => e.stopPropagation()}
                        title="View storefront"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = "var(--admin-text)";
                          (e.currentTarget as HTMLElement).style.background = "var(--admin-bg-muted)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = "var(--admin-text-3)";
                          (e.currentTarget as HTMLElement).style.background = "";
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}

                  <div style={{ borderTop: "1px solid var(--admin-divider)" }}>
                    <Link href="/dashboard/create-store" onClick={() => setSwitcherOpen(false)}>
                      <div
                        className="flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--admin-bg-subtle)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                          style={{ border: "1px dashed var(--admin-border)" }}
                        >
                          <Plus className="w-3 h-3" style={{ color: "var(--admin-text-3)" }} />
                        </div>
                        <p className="text-[12px] font-medium" style={{ color: "var(--admin-text-3)" }}>New store</p>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto hide-scrollbar px-3 py-2 space-y-0.5">
        <NavItem
          href="/dashboard"
          icon={LayoutDashboard}
          label="Home"
          active={pathname === "/dashboard"}
        />

        {activeStore && (
          <>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 pt-5 pb-1.5"
              style={{ color: "var(--admin-text-4)" }}
            >
              {activeStore.name}
            </p>
            {navItems.map(({ label, href, icon, exact }) => (
              <NavItem
                key={href}
                href={href}
                icon={icon}
                label={label}
                active={isNavActive(href, exact, label)}
              />
            ))}
          </>
        )}
      </nav>

      {/* ── User ── */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--admin-divider)" }}
      >
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{
            background: "var(--admin-bg-subtle)",
            border: "1px solid var(--admin-border)",
          }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={firstName} className="w-7 h-7 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {initials || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: "var(--admin-text)" }}>
              {firstName} {lastName}
            </p>
            <p className="text-[11px] truncate" style={{ color: "var(--admin-text-3)" }}>{email}</p>
          </div>
          <SignOutButton>
            <button
              className="p-1.5 rounded-lg transition-colors shrink-0"
              title="Sign out"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--admin-bg-muted)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              <LogOut className="w-3.5 h-3.5" style={{ color: "var(--admin-text-3)" }} />
            </button>
          </SignOutButton>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
        style={{ background: active ? "var(--admin-bg-muted)" : "transparent" }}
        onMouseEnter={(e) => {
          if (!active) (e.currentTarget as HTMLElement).style.background = "var(--admin-bg-subtle)";
        }}
        onMouseLeave={(e) => {
          if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <Icon
          className="w-4 h-4 shrink-0"
          style={{ color: active ? "var(--admin-text)" : "var(--admin-text-3)" }}
          strokeWidth={active ? 2.2 : 1.8}
        />
        <span
          className="text-[13px] flex-1"
          style={{
            color: active ? "var(--admin-text)" : "var(--admin-text-2)",
            fontWeight: active ? 600 : 450,
          }}
        >
          {label}
        </span>
        {active && (
          <div
            className="w-1 h-3.5 rounded-full shrink-0"
            style={{ background: "var(--admin-text)" }}
          />
        )}
      </div>
    </Link>
  );
}
