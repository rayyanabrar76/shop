"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SignOutButton } from "@clerk/nextjs";
import { storeUrl } from "@/lib/config";
import { storeInitials } from "@/lib/store-initials";
import AdminSearch from "./AdminSearch";
import {
  ChevronRight, LogOut, Plus, ChevronsUpDown, Eye, Pencil, Menu,
} from "lucide-react";
import { getStoreNav } from "@/lib/admin-nav";

type StoreItem = {
  id: string;
  name: string;
  subdomain: string;
  currency?: string;
  /** The store's own square mark, when it has uploaded one. Falls back to
      the first letter of its name -- most stores never upload anything. */
  markUrl?: string | null;
};

type Props = {
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  stores: StoreItem[];
};


export default function Sidebar({ firstName, lastName, email, imageUrl, stores }: Props) {
  const pathname = usePathname();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  /**
   * One block of the account card, arriving a beat after the one above it.
   * Arrive-only: on the way out everything leaves with the card, because a
   * reverse stagger makes closing feel slower than it is.
   */
  const arrive = (i: number): React.CSSProperties => ({
    opacity: accountOpen ? 1 : 0,
    transform: accountOpen ? 'translateY(0)' : 'translateY(6px)',
    transition: accountOpen
      ? `opacity 220ms cubic-bezier(0.22,0.32,0.16,1) ${60 + i * 45}ms, transform 260ms cubic-bezier(0.22,0.32,0.16,1) ${60 + i * 45}ms`
      : 'none',
  });
  const accountRef = useRef<HTMLDivElement>(null);

  // The account menu on the mobile header. Dismissable without navigating, for
  // the same reason as the store switcher below it.
  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node))
        setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAccountOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  // Route changes come from tapping something in one of these menus.
  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

  // Switching stores is the only job this menu has now that the store picker
  // page is gone, so it has to be dismissable without navigating.
  useEffect(() => {
    if (!switcherOpen) return;
    const onDown = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node))
        setSwitcherOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSwitcherOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [switcherOpen]);

  const activeStoreId =
    pathname.match(/\/dashboard\/stores\/([^/]+)/)?.[1] ?? stores[0]?.id ?? "";
  const activeStore = stores.find((s) => s.id === activeStoreId) ?? stores[0];
  const navItems = activeStore ? getStoreNav(activeStore.id) : [];

  const isNavActive = (href: string, exact?: boolean, label?: string) => {
    if (label === "Settings") return pathname === href || (pathname.startsWith(href) && !pathname.includes("/settings/payments"));
    if (label === "Payments") return pathname.startsWith(href);
    return exact ? pathname === href : pathname.startsWith(href);
  };

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  const storeMark = activeStore ? storeInitials(activeStore.name) : initials || "?";

  // Below md the sidebar is a drawer. It would otherwise take 240px of a 390px
  // screen and push the page it is navigating clean off the side.
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Tapping a link should reveal the page it went to, not leave the drawer
  // covering it.
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <>
    {/* A real header on small screens, rather than a lone floating button.
        It carries the three things wanted from any page: the menu, a way to
        see the shop, and the account. */}
    {/* h-15 is 3.75rem, and five places encode that height: this bar, the
        sidebar's top offset, the main content offset, and two calc()s in
        globals.css and the dashboard layout. They move together or the
        panel stops meeting the bar. */}
    <header
      className="fixed inset-x-0 top-0 z-50 h-15 flex items-center gap-1 px-2 md:px-3"
      style={{
        // Flat black reads as a hole. A faint sheen towards the top edge and a
        // one-pixel highlight along it make the bar a surface lit from above;
        // the soft dark line beneath sets the panel under it rather than
        // beside it.
        background:
          "linear-gradient(to bottom, color-mix(in srgb, var(--admin-header) 93%, white), var(--admin-header) 70%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 0 rgba(0,0,0,0.65)",
      }}
    >
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
        className="md:hidden group/btn flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-[background,transform] hover:bg-(--admin-header-hover) active:scale-[0.96]"
      >
        <Menu className="w-4 h-4" style={{ color: "var(--admin-header-text)" }} />
      </button>

      {/* On a wide screen the header runs above the sidebar, so the brand
          belongs here, the sidebar's own logo row is hidden to match. */}
      <Link
        href="/dashboard"
        className="hidden md:flex items-center gap-1 shrink-0 w-52 pl-5 group/brand"
      >
        {/* The artwork carries a wide black margin of its own, and it is the
            same black as the bar -- so the box crops to the glyph and the
            surplus simply disappears into the header, keeping the gap to the
            wordmark optically right rather than merely mathematically. */}
        <span className="w-5 h-5 shrink-0 overflow-hidden flex items-center justify-center transition-transform group-hover/brand:scale-[1.04]">
          <Image
            src="/logo.png"
            alt=""
            width={96}
            height={96}
            priority
            className="w-full h-full object-cover scale-[1.9]"
          />
        </span>
        {/* Set the way the landing page sets it, so the product is one brand
            either side of the sign-in. */}
        <span
          className="text-[15px] font-black tracking-tighter leading-none"
          style={{ color: "var(--admin-header-text)" }}
        >
          Shopflow<span className="text-violet-500">.</span>
        </span>
      </Link>

      {activeStore ? (
        <div className="flex-1 min-w-0 md:max-w-xl md:mx-auto">
          <AdminSearch storeId={activeStore.id} currency={activeStore.currency} />
        </div>
      ) : (
        <p
          className="flex-1 min-w-0 truncate text-[15px] font-black tracking-tighter leading-none"
          style={{ color: "var(--admin-header-text)" }}
        >
          Shopflow<span className="text-violet-500">.</span>
        </p>
      )}

      {activeStore && (
        <a
          href={storeUrl(activeStore.subdomain)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View storefront"
          title="View storefront"
          className="group/btn flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-[background,transform] hover:bg-(--admin-header-hover) active:scale-[0.96]"
        >
          <Eye
            className="w-4.5 h-4.5 transition-colors text-(--admin-header-text-2) group-hover/btn:text-(--admin-header-text)"
          />
        </a>
      )}

      <span
        className="hidden md:block h-5 w-px mx-1.5 shrink-0"
        style={{ background: "linear-gradient(to bottom, transparent, var(--admin-header-border), transparent)" }}
      />

      <div ref={accountRef} className="relative shrink-0">
        <button
          onClick={() => setAccountOpen((v) => !v)}
          aria-label="Account"
          aria-expanded={accountOpen}
          className="flex items-center gap-2 p-1 pr-2 rounded-lg transition-[background,transform] hover:bg-(--admin-header-hover) active:scale-[0.98]"
        >
          {/* The store's mark, not the person's face. This button is reached to
              switch stores far more often than to open account settings, and
              the menu it opens leads with the store list -- so the trigger
              should name the store it would switch away from. The user's own
              initials stand in only before any store exists. */}
          <span
            className="w-7 h-7 rounded-lg font-bold flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-white/15 shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
            style={{ background: "var(--admin-header-text)", color: "var(--admin-header)" }}
          >
            {activeStore?.markUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeStore.markUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className={storeMark.length > 2 ? "text-[9.5px] tracking-tight" : "text-[11px]"}>
                {storeMark}
              </span>
            )}
          </span>
          {activeStore && (
            <span
              className="hidden md:block max-w-32 truncate text-[13px] font-medium tracking-[-0.01em]"
              style={{ color: "var(--admin-header-text)" }}
            >
              {activeStore.name}
            </span>
          )}
        </button>

        <div
          inert={!accountOpen}
          aria-hidden={!accountOpen}
          className={`absolute right-0 top-full mt-2 w-76 max-md:w-66 rounded-2xl overflow-hidden origin-top-right backdrop-blur-xl transition-[opacity,transform] ${
            accountOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-[0.96] pointer-events-none'
          }`}
          style={{
            // Arrives slower than it leaves. 260ms on a curve that eases out
            // of the start is long enough to be seen settling; the old 180ms
            // expo was over before the eye registered it had begun. Closing
            // is quick and accelerates away.
            transitionDuration: accountOpen ? '260ms' : '150ms',
            transitionTimingFunction: accountOpen ? 'cubic-bezier(0.22, 0.32, 0.16, 1)' : 'cubic-bezier(0.4, 0, 1, 1)',
            background: "color-mix(in srgb, var(--admin-bg) 94%, transparent)",
            boxShadow: [
              "0 0 0 1px color-mix(in srgb, var(--admin-text) 9%, transparent)",
              "0 2px 4px -1px rgba(0,0,0,0.10)",
              "0 24px 48px -16px rgba(0,0,0,0.32)",
            ].join(", "),
          }}
        >
          {/* ── Where you are ─────────────────────────────────────────
              The menu opens on the store you are in, named plainly with
              its address, before it offers anywhere else to go. */}
          {activeStore && (
            <div
              className="m-1.5 mb-0 flex items-center gap-3 max-md:gap-2.5 rounded-xl px-3 py-3 max-md:px-2.5 max-md:py-2.5"
              style={{ background: "color-mix(in srgb, var(--admin-text) 5%, transparent)", ...arrive(0) }}
            >
              <span
                className="w-9 h-9 max-md:w-8 max-md:h-8 rounded-[10px] bg-black text-white font-bold flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-white/10"
              >
                {activeStore.markUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeStore.markUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className={storeMark.length > 2 ? "text-[10px] tracking-tight" : "text-[12px]"}>{storeMark}</span>
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-[13px] font-semibold" style={{ color: "var(--admin-text)" }}>
                  {activeStore.name}
                </span>
                <span className="block truncate text-[11px]" style={{ color: "var(--admin-text-3)" }}>
                  {storeUrl(activeStore.subdomain).replace(/^https?:\/\//, "")}
                </span>
              </span>
              <a
                href={storeUrl(activeStore.subdomain)}
                target="_blank"
                rel="noopener noreferrer"
                title="View storefront"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-(--admin-bg-muted)"
                style={{ color: "var(--admin-text-3)" }}
              >
                <Eye className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* ── Switch ──────────────────────────────────────────────── */}
          <div style={arrive(1)}>
          {stores.filter((s) => s.id !== activeStore?.id).length > 0 && (
            <>
              <p
                className="px-4 max-md:px-3.5 pt-3.5 max-md:pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--admin-text-4)" }}
              >
                Switch store
              </p>
              <div className="px-1.5">
                {stores.filter((s) => s.id !== activeStore?.id).map((store) => (
                  <Link
                    key={store.id}
                    href={`/dashboard/stores/${store.id}`}
                    className="group/row w-full flex items-center gap-2.5 px-2 py-1.5 max-md:py-1 rounded-lg text-left transition-colors hover:bg-(--admin-bg-muted)"
                  >
                    <span className="w-7 h-7 max-md:w-6 max-md:h-6 rounded-lg bg-black text-white font-bold flex items-center justify-center shrink-0 ring-1 ring-white/10 overflow-hidden">
                      {store.markUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={store.markUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className={storeInitials(store.name).length > 2 ? "text-[8.5px] tracking-tight" : "text-[10px]"}>
                          {storeInitials(store.name)}
                        </span>
                      )}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-[13px]" style={{ color: "var(--admin-text)" }}>
                      {store.name}
                    </span>
                    {/* Arrives with the hover, so the row says "go" only
                        when the pointer is already asking. */}
                    <ChevronRight
                      className="w-3.5 h-3.5 shrink-0 opacity-0 -translate-x-1 transition-[opacity,transform] group-hover/row:opacity-100 group-hover/row:translate-x-0"
                      style={{ color: "var(--admin-text-3)" }}
                    />
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="px-1.5 pt-1.5 pb-1.5">
            <Link
              href="/dashboard/create-store"
              className="group/row w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-(--admin-bg-muted)"
            >
              <span
                className="w-7 h-7 max-md:w-6 max-md:h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                style={{
                  border: "1px dashed color-mix(in srgb, var(--admin-text) 22%, transparent)",
                  color: "var(--admin-text-3)",
                }}
              >
                <Plus className="w-3.5 h-3.5" />
              </span>
              <span className="text-[13px]" style={{ color: "var(--admin-text-2)" }}>
                Create store
              </span>
            </Link>
          </div>
          </div>

          {/* ── The person ──────────────────────────────────────────── */}
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 max-md:px-2.5 max-md:py-2"
            style={{ borderTop: "1px solid color-mix(in srgb, var(--admin-text) 7%, transparent)", ...arrive(2) }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-black/5" />
            ) : (
              <span
                className="w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                style={{ background: "var(--admin-bg-muted)", color: "var(--admin-text-2)" }}
              >
                {initials || "?"}
              </span>
            )}
            <span className="flex-1 min-w-0">
              <span className="block truncate text-[12.5px] font-medium" style={{ color: "var(--admin-text)" }}>
                {firstName} {lastName}
              </span>
              <span className="block truncate text-[11px]" style={{ color: "var(--admin-text-3)" }}>
                {email}
              </span>
            </span>
            <SignOutButton>
              <button
                title="Log out"
                aria-label="Log out"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-(--admin-bg-muted)"
                style={{ color: "var(--admin-text-3)" }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </header>

    <div
      className={`md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
        drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={() => setDrawerOpen(false)}
      aria-hidden
    />

    {/* No rule down the right-hand edge: a line there was a third colour
        drawing a seam. The sidebar separates from the content panel by
        sitting a shade darker instead, which needs no edge to be read. */}
    <aside
      className={`fixed left-0 top-0 md:top-15 bottom-0 w-60 flex flex-col z-50 select-none md:rounded-tl-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform md:z-40 md:translate-x-0 md:transition-none ${
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ background: "var(--admin-sidebar)" }}
    >
      {/* ── Logo ── mobile only: on desktop the header above carries it. */}
      <div
        className="md:hidden flex items-center gap-2.5 px-5 h-15 shrink-0"
        style={{ borderBottom: "1px solid var(--admin-divider)" }}
      >
        <div className="w-7 h-7 rounded-lg bg-black overflow-hidden flex items-center justify-center shrink-0">
          <Image src="/logo.png" alt="" width={96} height={96} className="w-full h-full object-cover scale-[1.55]" />
        </div>
        <span
          className="text-[15px] font-black tracking-tighter leading-none flex-1"
          style={{ color: "var(--admin-text)" }}
        >
          Shopflow<span className="text-violet-600">.</span>
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
          <div className="relative hidden" ref={switcherRef}>
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
                        href={storeUrl(store.subdomain)}
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
        {activeStore && (
          <>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 pt-2 pb-1.5"
              style={{ color: "var(--admin-text-3)" }}
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
                // Customization is the one row with somewhere else worth going:
                // the live shop, and the editor itself.
                actions={
                  label === "Customization" && activeStore
                    ? [
                        {
                          key: "view",
                          title: "View storefront",
                          icon: Eye,
                          href: storeUrl(activeStore.subdomain),
                          external: true,
                        },
                        {
                          key: "edit",
                          title: "Open the visual editor",
                          icon: Pencil,
                          href: `/dashboard/stores/${activeStore.id}/theme/editor`,
                        },
                      ]
                    : undefined
                }
              />
            ))}
          </>
        )}
      </nav>

      {/* ── User ── the header account menu holds this now. */}
      <div
        className="hidden px-3 py-3 shrink-0"
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
    </>
  );
}

type NavAction = {
  key: string;
  title: string;
  icon: React.ElementType;
  href: string;
  external?: boolean;
};

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  actions,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  /** Shortcuts revealed on hover, shown instead of the active marker. */
  actions?: NavAction[];
}) {
  return (
    <div
      className="group/nav relative rounded-xl transition-all"
      style={{
        background: active ? "var(--admin-sidebar-active)" : "transparent",
        // A hairline and a whisper of shadow, so the selected row reads as
        // lifted off the sidebar rather than as a slightly different grey.
        boxShadow: active ? "var(--admin-sidebar-ring)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--admin-sidebar-hover)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <Link href={href}>
        {/* Room on the right for the actions where they are always showing,
            so the label does not run under them. */}
        <div className={`flex items-center gap-2.5 px-3 py-2 ${actions ? "touch:pr-14" : ""}`}>
          <Icon
            className="w-4.5 h-4.5 shrink-0"
            style={{ color: active ? "var(--admin-text)" : "var(--admin-text-2)" }}
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
          {/* Hidden while the actions are showing, so they do not stack up. */}
          {active && (
            <div
              className={`w-1 h-3.5 rounded-full shrink-0 ${actions ? "group-hover/nav:opacity-0 touch:opacity-0" : ""}`}
              style={{ background: "var(--admin-text)" }}
            />
          )}
        </div>
      </Link>

      {/* Revealed on hover where there is a hover. On a touch screen there
          is not, so they stay, and shrink so two extra glyphs do not crowd a
          row that also has to hold the label. Keyed to the pointer rather
          than the width: a touchscreen laptop needs them too. */}
      {actions && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/nav:opacity-100 focus-within:opacity-100 touch:opacity-100 transition-opacity">
          {actions.map(a => {
            const Ico = a.icon;
            return (
              <a
                key={a.key}
                href={a.href}
                title={a.title}
                aria-label={a.title}
                {...(a.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className="p-1.5 touch:p-1 rounded-lg transition-colors"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--admin-bg-muted)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <Ico className="w-3.5 h-3.5 touch:w-3 touch:h-3" style={{ color: "var(--admin-text-2)" }} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
