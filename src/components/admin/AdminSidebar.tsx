"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/admin/SignOutButton";

export type AdminNavLabels = {
  title: string;
  dashboard: string;
  products: string;
  categories: string;
  orders: string;
  import: string;
  signOut: string;
};

export default function AdminSidebar({ labels }: { labels: AdminNavLabels }) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: labels.dashboard },
    { href: "/admin/products", label: labels.products },
    { href: "/admin/categories", label: labels.categories },
    { href: "/admin/orders", label: labels.orders },
    { href: "/admin/import", label: labels.import },
  ];

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-ink/10 bg-white p-4">
      <Link href="/admin" className="mb-6 px-3 text-lg font-extrabold text-ink">
        {labels.title}
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const active =
            link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "rounded-md bg-mint px-3 py-2 text-sm font-bold text-ink"
                  : "rounded-md px-3 py-2 text-sm font-semibold text-ink/60 transition hover:bg-ink/5 hover:text-ink"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <SignOutButton label={labels.signOut} />
    </aside>
  );
}
