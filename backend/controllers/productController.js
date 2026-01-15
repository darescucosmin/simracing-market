// controllers/productController.js
import prisma from "../db/db.config.js";

export const createProduct = async (req, res) => {
  try {
    const { name, description, imageUrl, stock, price } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ error: "name and price are required" });
    }

    const stockInt = stock === undefined ? 0 : parseInt(stock, 10);
    if (Number.isNaN(stockInt) || stockInt < 0) {
      return res.status(400).json({ error: "stock must be a non-negative integer" });
    }

    const priceValue = typeof price === "number" ? price.toFixed(2) : String(price);

    const product = await prisma.product.create({
      data: {
        name,
        description: description ?? null,
        imageUrl: imageUrl ?? null,
        stock: stockInt,
        price: priceValue,
      },
    });

    return res.status(201).json({ product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid product id" });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: "Product not found" });

    return res.status(200).json({ product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid product id" });

    const { name, description, imageUrl, stock, price } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;

    if (stock !== undefined) {
      const stockInt = parseInt(stock, 10);
      if (Number.isNaN(stockInt) || stockInt < 0) {
        return res.status(400).json({ error: "stock must be a non-negative integer" });
      }
      data.stock = stockInt;
    }

    if (price !== undefined) {
      data.price = typeof price === "number" ? price.toFixed(2) : String(price);
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return res.status(200).json({ product });
  } catch (error) {
    console.error(error);

    if (String(error?.code) === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE
export const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid product id" });

    await prisma.product.delete({ where: { id } });

    return res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    console.error(error);

    if (String(error?.code) === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
};
