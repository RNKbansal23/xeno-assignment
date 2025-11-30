const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { syncAllData } = require('./services/shopify'); // <--- 1. IMPORT ADDED
const router = express.Router();
const prisma = new PrismaClient();

// --- MIDDLEWARE: Mock Authentication ---
const requireAuth = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized: Missing Tenant ID' });
  }
  
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return res.status(401).json({ error: 'Invalid Tenant' });
  }

  req.tenantId = tenantId;
  next();
};

// --- 1. LOGIN API ---
router.post('/login', async (req, res) => {
  const { shopDomain, password } = req.body;
  
  const tenant = await prisma.tenant.findUnique({ 
    where: { shopDomain } 
  });

  if (!tenant || tenant.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ 
    message: 'Login successful', 
    tenantId: tenant.id,
    storeName: tenant.storeName 
  });
});

// --- 2. SYNC API (The Missing Part) ---
router.post('/sync', async (req, res) => {
  const { tenantId } = req.body;
  if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });
  
  console.log(`⚡ Manual Sync Triggered for ${tenantId}`);
  
  // Trigger the sync service
  // We don't await this so the UI returns immediately
  syncAllData(tenantId).catch(err => console.error(err));

  res.json({ message: 'Sync started successfully' });
});

// --- 3. STATS API ---
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const revenueAgg = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { tenantId: req.tenantId }
    });
    const totalOrders = await prisma.order.count({
      where: { tenantId: req.tenantId }
    });
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

// --- 4. ORDERS API ---
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { tenantId: req.tenantId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 5. TOP CUSTOMERS API ---
router.get('/customers/top', requireAuth, async (req, res) => {
  try {
    const topCustomers = await prisma.customer.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { totalSpent: 'desc' },
      take: 5
    });
    res.json(topCustomers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;