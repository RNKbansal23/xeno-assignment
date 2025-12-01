# 🚀 Xeno FDE Internship Assignment – Shopify Data Ingestion Service

A full-stack multi-tenant system that automates data ingestion from Shopify (Orders, Customers, Products) and visualizes business insights on a real-time dashboard.

Built as part of the selection process for the **Forward Deployed Engineer** role at Xeno.

## 🔗 Live Demo
- **Frontend Dashboard:** [https://xeno-assignment.vercel.app](https://xeno-assignment.vercel.app)
- **Backend API:** [https://xeno-backend.onrender.com](https://xeno-backend.onrender.com)
- **Demo Video:** [Insert Your YouTube/Drive Link Here]

---

## 🏗 Architecture
The system follows a 3-tier architecture containerized for cloud deployment.

**[Shopify Store]** ⬇ *(REST API)*
**[Node.js Ingestion Service]** ➡ **[PostgreSQL Database]**
**[Express API Layer]** ⬆
**[Next.js Dashboard]**

---

## ✨ Key Features

### 1. Multi-Tenant Architecture
- Single backend serving multiple Shopify stores.
- Strict **Data Isolation**: Every database query is scoped by `tenant_id` to ensure Store A never sees Store B's data.

### 2. Smart Data Ingestion (The "Zero Revenue" Fix)
- **Problem:** Shopify updates customer spending asynchronously. Often, new orders show `$0.00` total spend immediately after creation.
- **Solution:** I implemented a **local aggregation strategy**. Instead of relying on Shopify's delayed totals, the service calculates `Customer Lifetime Value` locally by summing up order totals in real-time.

### 3. Hybrid Sync System
- **Scheduled Sync:** Runs automatically every hour via `node-cron`.
- **Manual Trigger:** A "Sync Now" button on the dashboard for immediate data updates using `upsert` logic to prevent duplicates.

### 4. Analytics Dashboard
- Built with **Next.js** and **Recharts**.
- Visualizes Total Revenue, Order Counts, and Sales Trends over time.

---

## 🛠 Tech Stack

| Component | Technology | Hosting |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14, Tailwind CSS, Recharts | Vercel |
| **Backend** | Node.js, Express.js | Render |
| **Database** | PostgreSQL, Prisma ORM | Neon (Cloud) |
| **Scheduler** | Node-cron | Render |

---

## 🚀 Setup Instructions (Run Locally)

### Prerequisites
- Node.js installed.
- PostgreSQL installed (or use a local connection string).

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/xeno-assignment.git
cd xeno-assignment
2. Backend Setup
code
Bash
cd server
npm install

# Create a .env file
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/xeno_db?schema=public"' > .env
echo 'SHOPIFY_ACCESS_TOKEN="your_shpat_token_here"' >> .env
echo 'PORT=5000' >> .env

# Run Database Migrations
npx prisma migrate dev

# Seed Initial Data (Creates the Tenant)
node prisma/seed.js

# Start Server
npm run dev
3. Frontend Setup
code
Bash
# Open a new terminal
cd client
npm install
npm run dev
Access the dashboard at http://localhost:3000.
📡 API Endpoints & Data Models
Database Schema (Prisma)
Tenant: Stores shop domain, credentials, and password.
Customer: Links to Tenant. Stores totalSpent (calculated locally).
Order: Links to Customer & Tenant.
Product: Links to Tenant.
API Routes
Method	Endpoint	Description
POST	/api/login	Authenticates user & returns Tenant ID.
POST	/api/sync	Triggers immediate Shopify sync.
GET	/api/stats	Returns total revenue, orders, and customer count.
GET	/api/orders	Returns order history for the sales chart.
GET	/api/customers/top	Returns leaderboard of top spending customers.
⚠️ Assumptions & Trade-offs
Currency: The dashboard assumes all monetary values are in USD ($) based on the provided test data.
Auth: Simple password-based authentication is used for the assignment scope. Production would utilize OAuth or JWT.
Data Sync: Polling (Cron) is used instead of Webhooks to ensure reliability within the 1-week timeline, though Webhooks would be preferred for production scaling.
