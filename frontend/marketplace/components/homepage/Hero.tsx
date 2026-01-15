"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./home.css";
import heroBg from "./assets/home-poza.webp";

export default function Hero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  const scrollToAbout = () => {
    const el = document.getElementById("about_us");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className={`hero ${ready ? "hero--ready" : ""}`}
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.19)),
          url(${heroBg.src})
        `,
      }}
    >
      <div className="hero-content">
        <h1 className="hero-title">Îmbunătește experiența de sim-racing</h1>
        <p className="hero-subtitle">Pedale, volane și accesorii premium</p>

        <div className="hero-buttons">
          <Link href="/products" className="btn primary">
            Vezi produsele
          </Link>

          <Link href="/login?mode=register" className="btn secondary">
            Creează cont
          </Link>
        </div>

        {/* butonul scroll */}
        <div className="hero-buttons hero-buttons--below">
          <button type="button" className="btn secondary" onClick={scrollToAbout}>
            Despre noi
          </button>
        </div>
      </div>
    </section>
  );
}
