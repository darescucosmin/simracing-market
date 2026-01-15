"use client";
import React, { useEffect, useMemo, useState } from "react";
import "./ProductsPage.css";
import Link from "next/link";
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

type ProductsResponse = {
  products: Product[];
};

export default function ProductsComponent() {
  const API_BASE = "http://localhost:5000";
  const ENDPOINT = `${API_BASE}/api/products`;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "priceAsc" | "priceDesc">("newest");

  // ✅ pentru loading pe butonul de add
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(ENDPOINT, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`GET products failed: ${res.status} ${text}`);
        }

        const data = (await res.json()) as Partial<ProductsResponse>;
        setProducts(Array.isArray(data?.products) ? data.products : []);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        const msg = e instanceof Error ? e.message : "Eroare la încărcarea produselor.";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = products.filter((p) => {
      if (!q) return true;
      const name = (p?.name || "").toLowerCase();
      const desc = (p?.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });

    if (sort === "priceAsc") {
      list = [...list].sort((a, b) => toNumber(a.price) - toNumber(b.price));
    } else if (sort === "priceDesc") {
      list = [...list].sort((a, b) => toNumber(b.price) - toNumber(a.price));
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    }

    return list;
  }, [products, query, sort]);

  // ✅ ADD TO CART integrare backend
  const addToCart = async (productId: number) => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      toast.error("Trebuie să fii logat ca să adaugi în coș.");
      // dacă vrei redirect:
      // window.location.href = "/login";
      return;
    }

    try {
      setAddingId(productId);

      const res = await fetch(`${API_BASE}/api/cart/${userId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data?.error || "Nu am putut adăuga produsul în coș.");
        return;
      }
      toast.success("Produs adăugat în coș!");
    } catch (e) {
      toast.error("Server indisponibil / eroare la coș.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="pp-wrap">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="pp-bgGlow" aria-hidden="true" />

      <header className="pp-header">
        <div className="pp-titleRow">
          <div>
            <h1 className="pp-title">Produse</h1>
            <p className="pp-subtitle">{loading ? "Se încarcă..." : `${filtered.length} produse`}</p>
          </div>

          <button className="pp-btn" onClick={() => window.location.reload()} title="Refresh">
            ↻ Refresh
          </button>
        </div>

        <div className="pp-controls">
          <div className="pp-search">
            <span className="pp-searchIcon">⌕</span>
            <input
              className="pp-searchInput"
              placeholder="Caută produs (nume / descriere)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="pp-selectWrap">
            <label className="pp-label">Sortare</label>
            <select
              className="pp-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="newest">Cele mai noi</option>
              <option value="priceAsc">Preț crescător</option>
              <option value="priceDesc">Preț descrescător</option>
            </select>
          </div>
        </div>
      </header>

      {err ? (
        <div className="pp-error">
          <div className="pp-errorTitle">Nu am putut încărca produsele</div>
          <div className="pp-errorText">{err}</div>
          <div className="pp-errorHint">
            Verifică că serverul rulează și ruta <b>/api/products</b> există.
          </div>
        </div>
      ) : null}

      <main className="pp-main">
        {loading ? (
          <div className="pp-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="pp-card pp-skeleton">
                <div className="pp-skelImg" />
                <div className="pp-skelLines">
                  <div className="pp-skelLine w80" />
                  <div className="pp-skelLine w60" />
                  <div className="pp-skelLine w90" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pp-grid">
            {filtered.map((p, idx) => {
              const inStock = (p?.stock ?? 0) > 0;
              const img = p?.imageUrl ?? "";
              const desc = p?.description ?? "—";
              const isAddingThis = addingId === p.id;

              return (
                <article
                  key={p.id}
                  className="pp-card pp-pop"
                  style={{ animationDelay: `${Math.min(idx * 40, 320)}ms` }}
                >
                  <div className="pp-imgWrap">
                    {img ? (
                      <img className="pp-img" src={img} alt={p?.name || "Product"} loading="lazy" />
                    ) : (
                      <div className="pp-imgFallback">No Image</div>
                    )}

                    <span className={`pp-badge ${inStock ? "ok" : "no"}`}>
                      {inStock ? `În stoc: ${p.stock}` : "Stoc epuizat"}
                    </span>
                  </div>

                  <div className="pp-cardBody">
                    <h3 className="pp-cardTitle" title={p?.name}>
                      {p?.name}
                    </h3>

                    <p className="pp-cardDesc" title={desc}>
                      {desc}
                    </p>

                    <div className="pp-cardFooter">
                      <div className="pp-price">{fmtPrice(p.price)}</div>

                      <Link className="pp-cta pp-ctaSecondary" href={`/products/${p.id}`}>
                        Vizualizează
                      </Link>

                      <button
                        className="pp-cta"
                        disabled={!inStock || isAddingThis}
                        onClick={() => addToCart(p.id)}
                      >
                        {isAddingThis ? "Se adaugă..." : inStock ? "Adaugă" : "Indisponibil"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !err && filtered.length === 0 ? (
          <div className="pp-empty">
            <div className="pp-emptyTitle">Niciun produs găsit</div>
            <div className="pp-emptyText">Încearcă alt text în căutare.</div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
