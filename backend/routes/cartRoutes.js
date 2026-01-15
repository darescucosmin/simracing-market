import express from "express";
import {
  createCart,
  getCartByUserId,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
  deleteCart,
} from "../controllers/cartController.js";

const router = express.Router();

// Cart CRUD
router.post("/", createCart);                 // body: { userId }
router.get("/:userId", getCartByUserId);      // include items + product
router.delete("/:userId", deleteCart);        // delete cart

// Cart items
router.post("/:userId/items", addItemToCart);                 // body: { productId, quantity? }
router.put("/:userId/items/:productId", updateCartItemQuantity); // body: { quantity }
router.delete("/:userId/items/:productId", removeItemFromCart);  // remove one item
router.delete("/:userId/clear", clearCart);                     // clear cart

export default router;
