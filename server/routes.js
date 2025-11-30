const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// --- MIDDLEWARE: Mock Authentication ---
// In a real app, use JWT. For this assignment, we pass 'x-tenant-id' header.
const requireAuth = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized: Missing Tenant ID' });
  }
  
  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return res.status(401).json({ error: 'Invalid Tenant' });
  }

  req.tenantId = tenantId; // Attach to request for isolation
  next();
};

// --- 1. LOGIN API ---
router.post('/login', async (req, res) => {
  const { shopDomain, password } = req.body;
  
  // Simple check (Plain text for assignment speed, use bcrypt in production)
  const tenant = await prisma.tenant.findUnique({ 
    where: { shopDomain } 
  });

  if (!tenant || tenant.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Return the ID to be used as a token on the frontend
  res.json({ 
    message: 'Login successful', 
    tenantId: tenant.id,
    storeName: tenant.storeName 
  });
});

// --- 2. STATS API (Total Sales, Order Count, Customer Count) ---
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // 1. Total Revenue
    const revenueAgg = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { tenantId: req.tenantId } // <--- ISOLATION
    });

    // 2. Total Orders
    const totalOrders = await prisma.order.count({
      where: { tenantId: req.tenantId }
    });

    // 3. Total Customers
    const totalCustomers = await prisma.customer.count({
      where: { tenantId: req.tenantId }
    });

    res.json({
      totalRevenue: revenueAgg._sum.totalPrice || 0,
      totalOrders,
      totalCustomers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 3. ORDERS API (With Date Filtering) ---
router.get('/orders', requireAuth, async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build Filter Object
  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        tenantId: req.tenantId, // <--- ISOLATION
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
      },
      include: { customer: true }, // Join customer data
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 4. TOP CUSTOMERS API ---
router.get('/customers/top', requireAuth, async (req, res) => {
  try {
    const topCustomers = await prisma.customer.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { totalSpent: 'desc' },
      take: 5 // Limit to top 5
    });
    res.json(topCustomers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;