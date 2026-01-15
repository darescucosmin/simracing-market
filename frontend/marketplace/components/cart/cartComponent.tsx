"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "./cartComponentStyle.css";
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

type CartItem = {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: Product;
  createdAt?: string;
  updatedAt?: string;
};

type Cart = {
  id: number;
  userId: number;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
};

type CartResponse = {
  cart: Cart;
};

type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: string | number;
  product: Product;
  createdAt?: string;
  updatedAt?: string;
};

type Order = {
  id: number;
  userId: number;
  total: string | number;
  status: string;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
};

type OrdersResponse = {
  orders: Order[];
};

export default function CartPage() {
  const API_BASE = "http://localhost:5000";

  const [userId, setUserId] = useState<string>("");
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [removingId, setRemovingId] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);

  // ✅ checkout + orders state
  const [checkingOut, setCheckingOut] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersErr, setOrdersErr] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);

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

  const fetchCart = async (uid: string, signal?: AbortSignal) => {
    const res = await fetch(`${API_BASE}/api/cart/${uid}`, { signal });
    const data = (await res.json().catch(() => ({}))) as Partial<CartResponse>;

    if (!res.ok) {
      const msg = (data as any)?.error || `GET cart failed: ${res.status}`;
      throw new Error(msg);
    }
    setCart(data.cart ?? null);
  };

  const fetchOrders = async (uid: string, signal?: AbortSignal) => {
    const res = await fetch(`${API_BASE}/api/orders/user/${uid}`, { signal });
    const data = (await res.json().catch(() => ({}))) as Partial<OrdersResponse>;

    if (!res.ok) {
      const msg = (data as any)?.error || `GET orders failed: ${res.status}`;
      throw new Error(msg);
    }
    setOrders(Array.isArray(data.orders) ? data.orders : []);
  };

  useEffect(() => {
    const uid = localStorage.getItem("userId") || "";
    setUserId(uid);

    if (!uid) {
      setLoading(false);
      setErr("Trebuie să fii logat ca să vezi coșul.");
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");
        await fetchCart(uid, controller.signal);

        // ✅ ia și comenzile
        setOrdersLoading(true);
        setOrdersErr("");
        await fetchOrders(uid, controller.signal);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        // dacă pică una, afișăm ce a picat
        const msg = e instanceof Error ? e.message : "Eroare la încărcare.";
        // dacă e din cart, o pui la cart
        if (msg.toLowerCase().includes("cart")) setErr(msg);
        else setOrdersErr(msg);
      } finally {
        setLoading(false);
        setOrdersLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const totalItems = useMemo(() => {
    const items = cart?.items ?? [];
    return items.reduce((sum, it) => sum + (it.quantity ?? 0), 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    const items = cart?.items ?? [];
    return items.reduce((sum, it) => sum + toNumber(it.product.price) * (it.quantity ?? 0), 0);
  }, [cart]);

  const removeItem = async (productId: number) => {
    if (!userId) return;

    try {
      setRemovingId(productId);

      const res = await fetch(`${API_BASE}/api/cart/${userId}/items/${productId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data as any)?.error || "Nu am putut șterge produsul.");
        return;
      }

      toast.success("Produs șters din coș.");
      if ((data as any)?.cart) setCart((data as any).cart);
      else await fetchCart(userId);
    } catch {
      toast.error("Eroare la ștergere (server indisponibil).");
    } finally {
      setRemovingId(null);
    }
  };

  const clearCart = async () => {
    if (!userId) return;

    try {
      setClearing(true);

      const res = await fetch(`${API_BASE}/api/cart/${userId}/clear`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data as any)?.error || "Nu am putut goli coșul.");
        return;
      }

      toast.success("Coș golit.");
      if ((data as any)?.cart) setCart((data as any).cart);
      else await fetchCart(userId);
    } catch {
      toast.error("Eroare la golire (server indisponibil).");
    } finally {
      setClearing(false);
    }
  };

  // ✅ CHECKOUT real: POST /api/orders/:userId
  const checkout = async () => {
    if (!userId) return;

    const items = cart?.items ?? [];
    if (!items.length) {
      toast.info("Coșul e gol.");
      return;
    }

    try {
      setCheckingOut(true);

      const res = await fetch(`${API_BASE}/api/orders/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error((data as any)?.error || "Checkout eșuat.");
        return;
      }

      toast.success("Comandă plasată cu succes!");

      // backend ți-a golit coșul în tranzacție, deci refresh
      await fetchCart(userId);
      await fetchOrders(userId);
    } catch {
      toast.error("Eroare la checkout (server indisponibil).");
    } finally {
      setCheckingOut(false);
    }
  };

  // ✅ Cancel order: DELETE /api/orders/:orderId
  const cancelOrder = async (orderId: number) => {
    try {
      setCancelingOrderId(orderId);

      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data as any)?.error || "Nu am putut anula comanda.");
        return;
      }

      toast.success("Comandă anulată.");
      // scoate local + opțional refetch
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      toast.error("Eroare la anulare (server indisponibil).");
    } finally {
      setCancelingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="cp-wrap">
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        <div className="cp-bgGlow" aria-hidden="true" />
        <div className="cp-shell">
          <header className="cp-header">
            <div>
              <h1 className="cp-title">Coșul tău</h1>
              <p className="cp-subtitle">Se încarcă...</p>
            </div>
            <div className="cp-headerActions">
              <Link className="cp-btnGhost" href="/products">
                ← Înapoi la produse
              </Link>
            </div>
          </header>

          <div className="cp-grid">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="cp-card cp-skeleton">
                <div className="cp-skelImg" />
                <div className="cp-skelLines">
                  <div className="cp-skelLine w70" />
                  <div className="cp-skelLine w40" />
                  <div className="cp-skelLine w90" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="cp-wrap">
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        <div className="cp-bgGlow" aria-hidden="true" />
        <div className="cp-shell">
          <header className="cp-header">
            <div>
              <h1 className="cp-title">Coșul tău</h1>
              <p className="cp-subtitle">A apărut o problemă</p>
            </div>
            <div className="cp-headerActions">
              <Link className="cp-btnGhost" href="/products">
                ← Înapoi la produse
              </Link>
            </div>
          </header>

          <div className="cp-error">
            <div className="cp-errorTitle">Nu am putut încărca coșul</div>
            <div className="cp-errorText">{err}</div>
            <div className="cp-errorHint">
              Asigură-te că ești logat și că ruta <b>/api/cart/:userId</b> funcționează.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];

  return (
    <div className="cp-wrap">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="cp-bgGlow" aria-hidden="true" />

      <div className="cp-shell">
        <header className="cp-header">
          <div>
            <h1 className="cp-title">Coșul tău</h1>
            <p className="cp-subtitle">
              {items.length ? `${totalItems} produse • ${fmtPrice(subtotal)}` : "Coș gol"}
            </p>
          </div>

          <div className="cp-headerActions">
            <Link className="cp-btnGhost" href="/products">
              ← Produse
            </Link>

            <button className="cp-btn" onClick={() => window.location.reload()} title="Refresh">
              ↻ Refresh
            </button>

            <button className="cp-btnDanger" onClick={clearCart} disabled={!items.length || clearing}>
              {clearing ? "Se golește..." : "Golește coșul"}
            </button>
          </div>
        </header>

        <div className="cp-layout">
          {/* LIST */}
          <section className="cp-list">
            {items.length === 0 ? (
              <div className="cp-empty">
                <div className="cp-emptyTitle">Coșul este gol</div>
                <div className="cp-emptyText">Mergi la produse și adaugă ceva bun 😊</div>
                <Link className="cp-btnPrimary" href="/products">
                  Vezi produse
                </Link>
              </div>
            ) : (
              <div className="cp-grid">
                {items.map((it, idx) => {
                  const p = it.product;
                  const img = p.imageUrl ?? "";
                  const lineTotal = toNumber(p.price) * (it.quantity ?? 0);
                  const isRemoving = removingId === p.id;

                  return (
                    <article
                      key={it.id}
                      className="cp-card cp-pop"
                      style={{ animationDelay: `${Math.min(idx * 40, 360)}ms` }}
                    >
                      <div className="cp-imgWrap">
                        {img ? (
                          <img className="cp-img" src={img} alt={p.name} loading="lazy" />
                        ) : (
                          <div className="cp-imgFallback">No Image</div>
                        )}

                        <span className="cp-badge">x{it.quantity}</span>
                      </div>

                      <div className="cp-cardBody">
                        <div className="cp-cardTop">
                          <h3 className="cp-cardTitle" title={p.name}>
                            {p.name}
                          </h3>
                          <Link className="cp-miniLink" href={`/products/${p.id}`}>
                            Detalii →
                          </Link>
                        </div>

                        <p className="cp-cardDesc" title={p.description ?? ""}>
                          {p.description ?? "—"}
                        </p>

                        <div className="cp-cardFooter">
                          <div className="cp-prices">
                            <div className="cp-priceMain">{fmtPrice(p.price)}</div>
                            <div className="cp-priceSub">
                              Total: <b>{fmtPrice(lineTotal)}</b>
                            </div>
                          </div>

                          <button
                            className="cp-remove"
                            onClick={() => removeItem(p.id)}
                            disabled={isRemoving}
                            title="Șterge din coș"
                          >
                            {isRemoving ? "Se șterge..." : "Șterge"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* SUMMARY */}
          <aside className="cp-summary cp-pop" style={{ animationDelay: "80ms" }}>
            <div className="cp-summaryHead">
              <h2 className="cp-h2">Sumar</h2>
              <p className="cp-muted">Detalii rapide despre coș.</p>
            </div>

            <div className="cp-summaryRows">
              <div className="cp-row">
                <span>Produse</span>
                <span>{totalItems}</span>
              </div>
              <div className="cp-row">
                <span>Subtotal</span>
                <span>{fmtPrice(subtotal)}</span>
              </div>
              <div className="cp-row">
                <span>Transport</span>
                <span className="cp-note">Calculat la checkout</span>
              </div>

              <div className="cp-divider" />

              <div className="cp-row cp-total">
                <span>Total</span>
                <span>{fmtPrice(subtotal)}</span>
              </div>
            </div>

            <button
              className="cp-btnPrimary"
              disabled={!items.length || checkingOut}
              onClick={checkout}
            >
              {checkingOut ? "Se plasează comanda..." : "Checkout"}
            </button>

            <div className="cp-safe">
              <span className="dot" />
              Plată sigură • Date protejate
            </div>
          </aside>
        </div>

        {/* ✅ ORDERS SECTION */}
        <section className="cp-orders">
          <div className="cp-ordersHead">
            <div>
              <h2 className="cp-h2">Comenzile mele</h2>
              <p className="cp-muted">Istoric comenzi + anulare.</p>
            </div>

            <button
              className="cp-btn"
              onClick={async () => {
                if (!userId) return;
                try {
                  setOrdersLoading(true);
                  setOrdersErr("");
                  await fetchOrders(userId);
                  toast.success("Comenzi actualizate.");
                } catch (e) {
                  setOrdersErr(e instanceof Error ? e.message : "Eroare la comenzi.");
                  toast.error("Nu am putut încărca comenzile.");
                } finally {
                  setOrdersLoading(false);
                }
              }}
            >
              {ordersLoading ? "Se încarcă..." : "↻ Refresh comenzi"}
            </button>
          </div>

          {ordersErr ? (
            <div className="cp-ordersError">
              <b>Eroare:</b> {ordersErr}
            </div>
          ) : null}

          {orders.length === 0 ? (
            <div className="cp-ordersEmpty">
              Nu ai încă nicio comandă. După checkout, va apărea aici.
            </div>
          ) : (
            <div className="cp-ordersGrid">
              {orders.map((o, idx) => {
                const itemsCount = (o.items ?? []).reduce((s, it) => s + (it.quantity ?? 0), 0);
                const isCanceling = cancelingOrderId === o.id;

                return (
                  <article
                    key={o.id}
                    className="cp-orderCard cp-pop"
                    style={{ animationDelay: `${Math.min(idx * 40, 320)}ms` }}
                  >
                    <div className="cp-orderTop">
                      <div className="cp-orderTitle">
                        Comanda #{o.id}
                        <span className="cp-orderStatus">{o.status}</span>
                      </div>

                      <button
                        className="cp-btnDangerSmall"
                        onClick={() => cancelOrder(o.id)}
                        disabled={isCanceling}
                        title="Anulează comanda"
                      >
                        {isCanceling ? "Se anulează..." : "Anulează"}
                      </button>
                    </div>

                    <div className="cp-orderMeta">
                      <div>
                        <span className="cp-note">Data:</span>{" "}
                        {o.createdAt ? new Date(o.createdAt).toLocaleString("ro-RO") : "—"}
                      </div>
                      <div>
                        <span className="cp-note">Produse:</span> {itemsCount}
                      </div>
                      <div>
                        <span className="cp-note">Total:</span> <b>{fmtPrice(o.total)}</b>
                      </div>
                    </div>

                    <div className="cp-orderItems">
                      {(o.items ?? []).slice(0, 4).map((it) => (
                        <div key={it.id} className="cp-orderItemRow">
                          <span className="cp-oiName">{it.product?.name ?? `Produs ${it.productId}`}</span>
                          <span className="cp-oiQty">x{it.quantity}</span>
                          <span className="cp-oiPrice">{fmtPrice(it.unitPrice)}</span>
                        </div>
                      ))}

                      {(o.items ?? []).length > 4 ? (
                        <div className="cp-orderMore">+ {(o.items.length - 4)} produse...</div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
