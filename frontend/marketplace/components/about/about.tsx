"use client";

import { useEffect } from "react";
import Image from "next/image";
import "./aboutStyle.css";
import me from "./assets/me.jpg";

export default function AboutSection() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("#about_us .reveal"));
    if (!els.length) return;

    const show = (el: HTMLElement) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add("is-visible"));
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            show(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    els.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return (
    <section id="about_us" className="about">
      <div className="about-wrap">
        {/* HERO */}
        <div className="about-hero reveal">
          <div className="about-copy reveal">
            <h2>Despre noi</h2>
            <p>
              SIM RACING MARKET oferă o selecție atent aleasă de echipamente și accesorii
              pentru sim-racing, cu focus pe calitate, compatibilitate și upgrade-uri reale.
            </p>
            <p>
              Ne concentrăm pe o experiență modernă, clară și rapidă — de la descoperire până la achiziție.
            </p>
          </div>

          <div className="about-media reveal">
            <Image src={me} alt="Founder" className="about-img" priority />
          </div>
        </div>

        {/* CARDS */}
        <div className="about-sections">
          <div className="about-card reveal">
            <h3>Our mission</h3>
            <p>Să aducem mai aproape feeling-ul de motorsport prin echipamente premium.</p>
          </div>

          <div className="about-card reveal">
            <h3>What we offer</h3>
            <p>Pedale, volane, shiftere, cockpit-uri și accesorii compatibile cu setup-ul tău.</p>
          </div>

          <div className="about-card reveal">
            <h3>Contact</h3>
            <p>support@simracing-market.demo • +40 700 000 000</p>
          </div>
        </div>
      </div>
    </section>
  );
}
