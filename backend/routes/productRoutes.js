const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  exportLowStockProducts,
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/authMiddleware");


router.post("/", protect, createProduct);

router.get("/", protect, getProducts);

router.get("/low-stock", protect, getLowStockProducts);

router.get(
  "/export/low-stock",
  protect,
  adminOnly,
  exportLowStockProducts
);

router.put("/:id", protect, updateProduct);

router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;