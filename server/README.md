# FinTech Backend API

The backend for the FinTech application, built with Node.js, Express, and MongoDB.

## 🔒 Environment Variables

To run this project, you will need to create a `.env` file in this directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

## 🛠️ Scripts
- `npm start`: Runs the server using `nodemon`.
- `npm dev`: Shortcut for `npm start`.

## 📦 Core Modules
- **Auth**: User registration, login, and JWT management.
- **Expenses**: CRUD operations for financial records.
- **Reports**: Data aggregation for charts and exports (XLSX/PDF).
- **Uploads**: Local storage for vendor invoices and documents.

## 🚀 API Endpoints (Overview)
- `POST /api/auth/register`: Create a new account.
- `POST /api/auth/login`: Authenticate and receive a JWT.
- `GET /api/expenses`: Retrieve all financial records.
- `POST /api/expenses`: Add a new transaction.
- `GET /api/reports/summary`: Statistical data for the dashboard.
