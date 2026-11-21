# Invento – Inventory & Order Management System

**Smart Stock & Business Management**

Invento is a lightweight inventory and order management system designed to help small businesses manage products, stock levels, customers, suppliers, and order fulfilment through a centralized dashboard.

## Features

### Authentication & Authorization
- Secure user authentication using JWT.
- Password hashing.
- Role-based access control for Admin and Staff.
- Protected routes and API endpoints.

### Product Management
- Add, view, update, and delete products.
- Manage product details, SKU, price, and stock threshold.
- Search products by name or SKU.
- Identify low-stock products.

### Stock Management
- Record stock IN and OUT movements.
- Maintain stock movement history.
- Track the user responsible for stock adjustments.
- Prevent stock from becoming negative.
- Restrict stock adjustments to authorized users.

### Order Management
- Create and manage orders.
- Track order statuses:
  - Draft
  - Confirmed
  - Packed
  - Dispatched
  - Delivered
  - Cancelled
- Calculate order totals on the server.
- Preserve product prices in order records.
- Reserve and restore stock through order status transitions.
- Prevent overselling and repeated stock restoration.

### Customers & Suppliers
- Add, view, update, and delete customer records.
- Manage supplier information.

### Inventory Reports
- Identify products that have reached their low-stock threshold.
- Export low-stock product information as a CSV file.
- Search and filter inventory records.

## Technology Stack

**Frontend**
- React.js
- Vite
- Tailwind CSS
- React Router

**Backend**
- Node.js
- Express.js
- REST API
- JWT Authentication

**Database**
- MongoDB
- Mongoose

## Project Structure

```text
nexbuild-inventory/
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
│
└── backend/
    ├── controllers/
    ├── models/
    ├── routes/
    ├── middleware/
    └── server.js
```

*Note: The structure above shows the main application areas.*

## Installation & Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd nexbuild-inventory
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Configure your backend environment variables in the `.env` file according to the backend configuration.

Start the backend using the development script defined in `backend/package.json`.

### 3. Setup Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL provided by Vite in your browser.

## API Modules

The backend provides REST API modules for:

| Module | Base Route |
|---|---|
| Authentication | `/api/auth` |
| Products | `/api/products` |
| Stock Movements | `/api/stock-movements` |
| Customers | `/api/customers` |
| Suppliers | `/api/suppliers` |
| Orders | `/api/orders` |

Protected endpoints require valid authentication and the appropriate user role.

## Security & Data Integrity

- Passwords are securely hashed.
- JWT is used for authentication.
- Role-based permissions protect restricted operations.
- Stock updates are handled through controlled operations.
- Order totals and stock availability are handled by the backend.
- Database transactions help maintain stock consistency during order operations.

## Testing

The application has been tested for key workflows, including:

- Admin and Staff login.
- Product creation and updates.
- Role-based access restrictions.
- Stock adjustments and stock history.
- Insufficient-stock handling.
- Order creation and status updates.
- Stock restoration on order cancellation.
- Low-stock identification and CSV export.

## Project Purpose

This project was developed as part of the NexBuild internship assignment to demonstrate practical skills in full-stack development, REST API design, authentication, database management, inventory operations, and order processing.

---

**Invento – Smart Stock & Business Management**