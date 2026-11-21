
const express = require("express");
const router = express.Router();

const {
  adjustStock,
  getStockHistory,
} = require("../controllers/stockMovementController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/adjust", protect, adminOnly, adjustStock);

router.get("/:productId", protect, getStockHistory);

module.exports = router;

