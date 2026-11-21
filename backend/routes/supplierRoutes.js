
const express = require("express");
const router = express.Router();

const {
  createSupplier,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/", protect, createSupplier);

router.get("/", protect, getSuppliers);

router.put("/:id", protect, updateSupplier);

router.delete("/:id", protect, adminOnly, deleteSupplier);

module.exports = router;
