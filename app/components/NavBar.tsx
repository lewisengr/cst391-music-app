"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Main" },
  { href: "/new", label: "New" },
  { href: "/about", label: "About" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="navbar navbar-expand bg-dark" data-bs-theme="dark" aria-label="Main navigation">
      <div className="container flex-wrap">
        <Link className="navbar-brand" href="/">My Music</Link>
        <div className="navbar-nav">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "nav-link active" : "nav-link"}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
