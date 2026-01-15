"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./productDetailStyle.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

type ProductResponse = { product: Product };
type ProductsResponse = { products: Product[] };

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const API_BASE = "http://localhost:5000";

  const productId = Number(params.id);
  const productUrl = `${API_BASE}/api/products/${productId}`;
  const allProductsUrl = `${API_BASE}/api/products`;

  const [product, setProduct] = useState<Product | null>(null);
  const [reco, setReco] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ loading pe butonul "Adaugă în coș"
  const [adding, setAdding] = useState(false);

  // carousel ref
  const trackRef = useRef<HTMLDivElement | null>(null);

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

  // Fetch product by id + all products for recommendations
  useEffect(() => {
    if (!productId) {
      setErr("ID produs invalid.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const [pRes, allRes] = await Promise.all([
          fetch(productUrl, { signal: controller.signal }),
          fetch(allProductsUrl, { signal: controller.signal }),
        ]);

        if (!pRes.ok) {
          const t = await pRes.text().catch(() => "");
          throw new Error(`GET product failed: ${pRes.status} ${t}`);
        }
        if (!allRes.ok) {
          const t = await allRes.text().catch(() => "");
          throw new Error(`GET products failed: ${allRes.status} ${t}`);
        }

        const pData = (await pRes.json()) as ProductResponse;
        const allData = (await allRes.json()) as ProductsResponse;

        setProduct(pData.product);

        const list = Array.isArray(allData?.products) ? allData.products : [];
        const filtered = list.filter((x) => x.id !== productId);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setReco(shuffled.slice(0, 10));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setErr(e instanceof Error ? e.message : "Eroare la încărcare.");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [productId, productUrl, allProductsUrl]);

  const inStock = (product?.stock ?? 0) > 0;

  // ✅ ADD TO CART real (backend)
  const addToCart = async () => {
    if (!product) return;

    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("Trebuie să fii logat ca să adaugi în coș.");
      // optional redirect:
      // window.location.href = "/login";
      return;
    }

    try {
      setAdding(true);

      const res = await fetch(`${API_BASE}/api/cart/${userId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data?.error || "Nu am putut adăuga produsul în coș.");
        return;
      }

      toast.success("Produs adăugat în coș!");
    } catch {
      toast.error("Server indisponibil / eroare la coș.");
    } finally {
      setAdding(false);
    }
  };

  const scrollCarousel = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.85);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  // UI states
  if (loading) {
    return (
      <div className="pd-wrap">
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        <div className="pd-bgGlow" aria-hidden="true" />
        <div className="pd-shell">
          <div className="pd-topbar">
            <Link className="pd-back" href="/products">
              ← Înapoi la produse
            </Link>
          </div>

          <div className="pd-skel">
            <div className="pd-skelMedia" />
            <div className="pd-skelRight">
              <div className="pd-skelLine w70" />
              <div className="pd-skelLine w40" />
              <div className="pd-skelLine w95" />
              <div className="pd-skelLine w90" />
              <div className="pd-skelLine w80" />
              <div className="pd-skelLine w60" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err || !product) {
    return (
      <div className="pd-wrap">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="pd-bgGlow" aria-hidden="true" />
        <div className="pd-shell">
          <div className="pd-topbar">
            <Link className="pd-back" href="/products">
              ← Înapoi la produse
            </Link>
          </div>

          <div className="pd-error">
            <div className="pd-errorTitle">Nu am putut încărca produsul</div>
            <div className="pd-errorText">{err || "Produs inexistent."}</div>
            <div className="pd-errorHint">
              Verifică ruta backend: <b>/api/products/:id</b>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const desc = product.description ?? "—";
  const img = product.imageUrl ?? "";

  return (
    <div className="pd-wrap">
      {/* ✅ ToastContainer “la început de HTML” */}
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      <div className="pd-bgGlow" aria-hidden="true" />

      <div className="pd-shell">
        <div className="pd-topbar">
          <Link className="pd-back" href="/products">
            ← Înapoi la produse
          </Link>
          <div className="pd-topRight">
            <span className={`pd-pill ${inStock ? "ok" : "no"}`}>
              {inStock ? `În stoc: ${product.stock}` : "Stoc epuizat"}
            </span>
          </div>
        </div>

        {/* HERO */}
        <section className="pd-hero">
          <div className="pd-media">
            {img ? (
              <img className="pd-img" src={img} alt={product.name} />
            ) : (
              <div className="pd-imgFallback">No Image</div>
            )}
          </div>

          <div className="pd-info">
            <h1 className="pd-title">{product.name}</h1>
            <div className="pd-meta">
              <div className="pd-price">{fmtPrice(product.price)}</div>
              <div className="pd-id">ID: {product.id}</div>
            </div>

            <p className="pd-desc">{desc}</p>

            <div className="pd-actions">
              <button
                className="pd-btnPrimary"
                disabled={!inStock || adding}
                onClick={addToCart}
              >
                {adding ? "Se adaugă..." : inStock ? "Adaugă în coș" : "Indisponibil"}
              </button>

              <Link className="pd-btnGhost" href="/products">
                Vezi toate produsele
              </Link>
            </div>

            <div className="pd-specs">
              <div className="pd-spec">
                <span className="pd-specLabel">Stoc</span>
                <span className="pd-specValue">{product.stock}</span>
              </div>
              <div className="pd-spec">
                <span className="pd-specLabel">Preț</span>
                <span className="pd-specValue">{fmtPrice(product.price)}</span>
              </div>
              <div className="pd-spec">
                <span className="pd-specLabel">Actualizat</span>
                <span className="pd-specValue">
                  {product.updatedAt ? new Date(product.updatedAt).toLocaleString("ro-RO") : "—"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* RECOMMENDED */}
        <section className="pd-panel">
          <div className="pd-panelHead pd-panelHeadRow">
            <div>
              <h2 className="pd-h2">Produse recomandate</h2>
              <p className="pd-muted">Scroll orizontal • folosește rotița/trackpad sau butoanele.</p>
            </div>

            <div className="pd-carouselBtns">
              <button className="pd-carBtn" onClick={() => scrollCarousel("left")} aria-label="Left">
                ←
              </button>
              <button className="pd-carBtn" onClick={() => scrollCarousel("right")} aria-label="Right">
                →
              </button>
            </div>
          </div>

          <div className="pd-carousel" ref={trackRef}>
            {reco.map((x, idx) => {
              const ok = (x.stock ?? 0) > 0;
              return (
                <Link
                  key={x.id}
                  className="pd-card"
                  href={`/products/${x.id}`}
                  style={{ animationDelay: `${Math.min(idx * 40, 360)}ms` }}
                >
                  <div className="pd-cardMedia">
                    {x.imageUrl ? (
                      <img className="pd-cardImg" src={x.imageUrl} alt={x.name} />
                    ) : (
                      <div className="pd-cardFallback">No Image</div>
                    )}
                    <span className={`pd-cardBadge ${ok ? "ok" : "no"}`}>
                      {ok ? `Stoc: ${x.stock}` : "Epuizat"}
                    </span>
                  </div>

                  <div className="pd-cardBody">
                    <div className="pd-cardTitle">{x.name}</div>
                    <div className="pd-cardPrice">{fmtPrice(x.price)}</div>
                  </div>
                </Link>
              );
            })}

            {reco.length === 0 ? <div className="pd-emptyReco">Nu există recomandări.</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
