const Order = require("../models/Order");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

// Create Order
const createOrder = async (req, res) => {
  try {
    const { customer, items } = req.body;

    if (!customer || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Customer and at least one product are required",
      });
    }

    const customerExists = await Customer.findById(customer);

    if (!customerExists) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      if (
        !item.product ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          message: "Each item needs a valid product ID and positive quantity",
        });
      }

      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;

      orderItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal,
      });
    }

    const order = await Order.create({
      customer,
      items: orderItems,
      totalAmount,
      status: "draft",
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// Get Orders
const getOrders = async (req, res) => {
  try {
    const {
      status,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    // Filter orders by date
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00.000Z`);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({ message: "Invalid start date" });
        }

        filter.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(`${endDate}T00:00:00.000Z`);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid end date" });
        }

        end.setUTCDate(end.getUTCDate() + 1);
        filter.createdAt.$lt = end;
      }

      if (
        startDate &&
        endDate &&
        new Date(startDate) > new Date(endDate)
      ) {
        return res.status(400).json({
          message: "Start date cannot be after end date",
        });
      }
    }

    if (search) {
      const customers = await Customer.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");

      filter.customer = { $in: customers.map((item) => item._id) };
    }

    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(100, Math.max(1, Number(limit) || 10));

    const orders = await Order.find(filter)
      .populate("customer", "name email")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit);

    const totalOrders = await Order.countDocuments(filter);

    res.status(200).json({
      totalOrders,
      currentPage,
      totalPages: Math.ceil(totalOrders / pageLimit),
      orders,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


const mongoose = require("mongoose");
const StockMovement = require("../models/StockMovement");

const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { status } = req.body;
    const { id } = req.params;

    const validStatuses = [
      "confirmed",
      "packed",
      "dispatched",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    let updatedOrder;

    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status === "draft" && status === "confirmed") {
        for (const item of order.items) {
          const product = await Product.findOneAndUpdate(
            {
              _id: item.product,
              stockQuantity: { $gte: item.quantity },
            },
            {
              $inc: { stockQuantity: -item.quantity },
            },
            { new: true, session }
          );

          if (!product) {
            throw new Error(`Insufficient stock for ${item.productName}`);
          }

          await StockMovement.create(
            [{
              product: item.product,
              type: "OUT",
              quantity: item.quantity,
              reason: `Order ${order._id} confirmed`,
              performedBy: req.user._id,
            }],
            { session }
          );
        }
      } else if (
        status === "cancelled" &&
        ["confirmed", "packed"].includes(order.status)
      ) {
        for (const item of order.items) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stockQuantity: item.quantity } },
            { session }
          );

          await StockMovement.create(
            [{
              product: item.product,
              type: "IN",
              quantity: item.quantity,
              reason: `Order ${order._id} cancelled - stock restored`,
              performedBy: req.user._id,
            }],
            { session }
          );
        }
      } else if (status === "cancelled" && order.status === "draft") {
        // Draft orders have not reserved any stock.
      } else {
        const allowedTransitions = {
          confirmed: ["packed"],
          packed: ["dispatched"],
          dispatched: ["delivered"],
          delivered: [],
          cancelled: [],
        };

        if (!allowedTransitions[order.status]?.includes(status)) {
          throw new Error(
            `Cannot change order from ${order.status} to ${status}`
          );
        }
      }

      order.status = status;
      updatedOrder = await order.save({ session });
    });

    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
};
