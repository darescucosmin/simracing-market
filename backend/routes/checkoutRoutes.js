import express from "express";
import { createOrderFromCart, deleteOrder, getOrdersByUser, getTopOrderedProducts } from "../controllers/checkoutController.js";

const router = express.Router();

router.post("/:userId", createOrderFromCart);

router.get("/user/:userId", getOrdersByUser);

router.delete("/:orderId", deleteOrder);

router.get("/top-products", getTopOrderedProducts);


export default router;
