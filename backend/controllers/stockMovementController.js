
const mongoose = require("mongoose");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");

const adjustStock = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { productId, type, quantity, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    if (!["IN", "OUT"].includes(type)) {
      return res.status(400).json({ message: "Type must be IN or OUT" });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive integer" });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Reason is required" });
    }

    await session.withTransaction(async () => {
      const product = await Product.findById(productId).session(session);

      if (!product) {
        throw new Error("Product not found");
      }

      if (type === "OUT" && product.stockQuantity < quantity) {
        throw new Error("Insufficient stock");
      }

      const change = type === "IN" ? quantity : -quantity;
      product.stockQuantity += change;

      await product.save({ session });

      await StockMovement.create(
        [{
          product: productId,
          type,
          quantity,
          reason: reason.trim(),
          performedBy: req.user._id,
        }],
        { session }
      );
    });

    res.status(200).json({ message: "Stock adjusted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};


const getStockHistory = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const history = await StockMovement.find({ product: productId })
      .populate("product", "name sku")
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: history.length,
      history,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { adjustStock, getStockHistory };
