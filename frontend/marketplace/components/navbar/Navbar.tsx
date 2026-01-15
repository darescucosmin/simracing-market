"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./navbar.css";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const isLoggedIn =
    typeof window !== "undefined" && localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    router.push("/login");
  };

  const linkClass = (href: string) =>
    `nav-link ${pathname === href ? "active" : ""}`;

  return (
    <header
      className={`navbar ${
        pathname === "/login" ? "navbar-login" : "navbar-home"
      }`}
    >
      <div className="logo">SIM RACING</div>

      <nav className="nav">
        <Link className={linkClass("/")} href="/">
          Home
        </Link>

        <Link className={linkClass("/products")} href="/products">
          Produse
        </Link>

        <Link className={linkClass("/cart")} href="/cart">
          Cart
        </Link>

        {!isLoggedIn ? (
          <Link className={linkClass("/login")} href="/login">
            Login
          </Link>
        ) : (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
