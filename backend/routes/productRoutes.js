// routes/productRoutes.js
import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

router.post("/", createProduct);       // POST    /products
router.get("/", getProducts);          // GET     /products  (TOATE)
router.get("/:id", getProductById);    // GET     /products/:id
router.put("/:id", updateProduct);     // PUT     /products/:id
router.delete("/:id", deleteProduct);  // DELETE  /products/:id

export default router;
