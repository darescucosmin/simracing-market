import prisma from "../db/db.config.js";

export const createOrderFromCart = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // găsește cart + items + product
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // calc total + verifică stoc
    let total = 0;

    for (const it of cart.items) {
      const price = parseFloat(String(it.product.price));
      total += price * it.quantity;

      if (it.product.stock < it.quantity) {
        return res.status(400).json({
          error: `Stoc insuficient pentru: ${it.product.name} (stoc: ${it.product.stock}, cerut: ${it.quantity})`,
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1) creează comanda
      const order = await tx.order.create({
        data: {
          userId,
          total: total.toFixed(2), // Prisma Decimal acceptă string
          status: "PLACED",
        },
      });

      // 2) creează order items (cu snapshot de preț)
      await tx.orderItem.createMany({
        data: cart.items.map((it) => ({
          orderId: order.id,
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: String(it.product.price),
        })),
      });

      // 3) scade stoc la produse
      for (const it of cart.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });
      }

      // 4) golește coșul
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // returnează comanda cu items
      const fullOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: { include: { product: true } },
        },
      });

      return fullOrder;
    });

    return res.status(201).json({ order: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({ error: "Invalid orderId" });
    }

    // șterge order (OrderItem se șterg automat prin Cascade)
    await prisma.order.delete({
      where: { id: orderId },
    });

    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getOrdersByUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ error: "Invalid userId" });

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


// GET /api/orders/top-products?limit=5
export const getTopOrderedProducts = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || "5", 10), 50));

    // top productId după suma quantity din order_items
    const grouped = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,

      // opțional: numără doar comenzile PLACED (dacă vrei)
      // where: { order: { status: "PLACED" } },
    });

    if (!grouped.length) {
      return res.status(200).json({ products: [] });
    }

    const productIds = grouped.map((g) => g.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // păstrează ordinea topului + atașează totalOrderedQty
    const prodMap = new Map(products.map((p) => [p.id, p]));

    const result = grouped
      .map((g) => {
        const p = prodMap.get(g.productId);
        if (!p) return null;
        return {
          ...p,
          totalOrderedQty: g._sum.quantity || 0,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ products: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
