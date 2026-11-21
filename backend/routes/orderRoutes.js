
const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/", protect, createOrder);

router.get("/", protect, getOrders);

router.patch("/:id/status", protect, updateOrderStatus);

module.exports = router;
