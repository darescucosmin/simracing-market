import prisma from "../db/db.config.js";

/** Helpers */
const toInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};

const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  return cart;
};

/** CREATE cart (opțional) */
export const createCart = async (req, res) => {
  try {
    const userId = toInt(req.body.userId);
    if (!userId) return res.status(400).json({ error: "userId invalid" });

    const existing = await prisma.cart.findUnique({ where: { userId } });
    if (existing) return res.status(200).json({ cart: existing });

    const cart = await prisma.cart.create({ data: { userId } });
    return res.status(201).json({ cart });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/** READ cart by userId (include items + product) */
export const getCartByUserId = async (req, res) => {
  try {
    const userId = toInt(req.params.userId);
    if (!userId) return res.status(400).json({ error: "userId invalid" });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    // dacă vrei să fie mereu existent coșul:
    if (!cart) {
      const newCart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } },
      });
      return res.status(200).json({ cart: newCart });
    }

    return res.status(200).json({ cart });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/** ADD item (dacă există, crește cantitatea) */
export const addItemToCart = async (req, res) => {
  try {
    const userId = toInt(req.params.userId);
    const productId = toInt(req.body.productId);
    const quantityRaw = req.body.quantity ?? 1;
    const quantity = toInt(quantityRaw) ?? 1;

    if (!userId) return res.status(400).json({ error: "userId invalid" });
    if (!productId) return res.status(400).json({ error: "productId invalid" });
    if (quantity < 1) return res.status(400).json({ error: "quantity must be >= 1" });

    // verifică produsul (opțional dar recomandat)
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const cart = await getOrCreateCart(userId);

    // upsert pe (cartId, productId)
    const item = await prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
      },
      update: {
        quantity: { increment: quantity },
      },
      include: { product: true },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });

    return res.status(200).json({ message: "Item added", item, cart: updatedCart });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/** UPDATE item quantity (setează exact cantitatea) */
export const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = toInt(req.params.userId);
    const productId = toInt(req.params.productId);
    const quantity = toInt(req.body.quantity);

    if (!userId) return res.status(400).json({ error: "userId invalid" });
    if (!productId) return res.status(400).json({ error: "productId invalid" });
    if (!quantity || quantity < 1) return res.status(400).json({ error: "quantity must be >= 1" });

    const cart = await getOrCreateCart(userId);

    const item = await prisma.cartItem.update({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
      data: { quantity },
      include: { product: true },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });

    return res.status(200).json({ message: "Item updated", item, cart: updatedCart });
  } catch (error) {
    // dacă nu există itemul
    if (String(error?.code) === "P2025") {
      return res.status(404).json({ error: "Cart item not found" });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/** DELETE item from cart */
export const removeItemFromCart = async (req, res) => {
  try {
    const userId = toInt(req.params.userId);
    const productId = toInt(req.params.productId);

    if (!userId) return res.status(400).json({ error: "userId invalid" });
    if (!productId) return res.status(400).json({ error: "productId invalid" });

    const cart = await getOrCreateCart(userId);

    await prisma.cartItem.delete({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });

    return res.status(200).json({ message: "Item removed", cart: updatedCart });
  } catch (error) {
    if (String(error?.code) === "P2025") {
      return res.status(404).json({ error: "Cart item not found" });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/** CLEAR cart (șterge toate itemele) */
export const clearCart = async (req, res) => {
  try {
    const userId = toInt(req.params.userId);
    if (!userId) return res.status(400).json({ error: "userId invalid" });

    const cart = await getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });

    return res.status(200).json({ message: "Cart cleared", cart: updatedCart });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/** DELETE cart (șterge coșul cu totul) */
export const deleteCart = async (req, res) => {
  try {
    const userId = toInt(req.params.userId);
    if (!userId) return res.status(400).json({ error: "userId invalid" });

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    // items se șterg automat (onDelete: Cascade), dar e ok și explicit:
    await prisma.cart.delete({ where: { id: cart.id } });

    return res.status(200).json({ message: "Cart deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
