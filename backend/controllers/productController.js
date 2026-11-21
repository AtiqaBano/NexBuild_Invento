const Product = require("../models/Product");
const Order = require("../models/Order");
const StockMovement = require("../models/StockMovement");

// Create Product
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// Get All Products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    if (Object.prototype.hasOwnProperty.call(req.body, "stockQuantity")) {
      return res.status(400).json({
        message: "Stock quantity must be updated through stock adjustment",
      });
    }

    const allowedFields = [
      "name",
      "sku",
      "description",
      "price",
      "lowStockThreshold",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// Delete Product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Check whether product is used in existing orders
    const existingOrder = await Order.findOne({
      "items.product": product._id,
    });

    if (existingOrder) {
      return res.status(400).json({
        message: "Product cannot be deleted because it is used in existing orders",
      });
    }

    // Check whether product has stock movement history
    const existingMovement = await StockMovement.findOne({
      product: product._id,
    });

    if (existingMovement) {
      return res.status(400).json({
        message: "Product cannot be deleted because it has stock movement history",
      });
    }

    await Product.findByIdAndDelete(product._id);

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// Get Low Stock Products
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: {
        $lte: ["$stockQuantity", "$lowStockThreshold"],
      },
    }).sort({ stockQuantity: 1 });

    res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Export Low Stock Products as CSV
const exportLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: {
        $lte: ["$stockQuantity", "$lowStockThreshold"],
      },
    });

    const headers = [
      "Product Name",
      "SKU",
      "Current Stock",
      "Low Stock Threshold",
      "Price",
    ];

    const rows = products.map((product) => [
      product.name,
      product.sku,
      product.stockQuantity,
      product.lowStockThreshold,
      product.price,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment("low-stock-products.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  exportLowStockProducts,
};
