"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./home.css";

type Product = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  stock: number;
  price: string | number;
  createdAt?: string;
  updatedAt?: string;
};

type ProductsResponse = { products: Product[] };

export default function FeaturedProducts() {
  const API_BASE = "http://localhost:5000";
  const ENDPOINT = `${API_BASE}/api/products`;

  const rootRef = useRef<HTMLElement | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>("");

  // reveal on scroll (păstrat)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    const targets = Array.from(root.querySelectorAll(".reveal"));

    if (reduceMotion) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [products.length, loading]);

  // fetch produse
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(ENDPOINT, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`GET products failed: ${res.status} ${text}`);
        }

        const data = (await res.json()) as Partial<ProductsResponse>;
        const list = Array.isArray(data?.products) ? data.products : [];

        // recomandate = cele mai noi (după createdAt) + doar primele 3
        const sorted = [...list].sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        );

        setProducts(sorted.slice(0, 3));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setErr(e instanceof Error ? e.message : "Eroare la încărcarea produselor.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [ENDPOINT]);

  const toNumber = (val: string | number): number => {
    const n = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const fmtPrice = (value: string | number): string => {
    const n = toNumber(value);
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  };

  return (
    <section ref={rootRef} className="featured">
      <h2 className="reveal">Produse recomandate</h2>

      {err ? (
        <div className="product-card reveal is-visible">
          <b>Eroare:</b> {err}
        </div>
      ) : null}

      <div className="products-grid">
        {loading ? (
          <>
            <div className="product-card reveal is-visible">Se încarcă...</div>
            <div className="product-card reveal is-visible">Se încarcă...</div>
            <div className="product-card reveal is-visible">Se încarcă...</div>
          </>
        ) : (
          products.map((p) => {
            const inStock = (p.stock ?? 0) > 0;

            return (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="product-card reveal"
                style={{ textDecoration: "none", color: "inherit" }}
                title={p.name}
              >
                {/* Imagine (fără să-ți stric CSS-ul: folosim inline minimal) */}
                <div
                  style={{
                    height: 240,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.03)",
                    display: "grid",
                    placeItems: "center",
                    marginBottom: 14,
                    overflow: "hidden",
                  }}
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      loading="lazy"
                    />
                  ) : (
                    <span style={{ opacity: 0.7, fontWeight: 700 }}>No Image</span>
                  )}
                </div>

                <div style={{ fontWeight: 800, marginBottom: 8 }}>{p.name}</div>

                <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.4, minHeight: 38 }}>
                  {(p.description ?? "—").slice(0, 90)}
                  {(p.description ?? "").length > 90 ? "..." : ""}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{fmtPrice(p.price)}</div>
                  <div style={{ opacity: 0.8, fontWeight: 700, fontSize: 13 }}>
                    {inStock ? `Stoc: ${p.stock}` : "Epuizat"}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
