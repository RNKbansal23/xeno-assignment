const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { syncAllData } = require('./services/shopify');
const apiRoutes = require('./routes'); // <--- Import Routes
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- MOUNT API ROUTES ---
app.use('/api', apiRoutes); 
// Now all your routes are at /api/login, /api/stats, etc.

// Scheduler (Keep this)
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Running Scheduled Sync...');
  const tenants = await prisma.tenant.findMany();
  for (const tenant of tenants) {
    await syncAllData(tenant.id);
  }
});

app.get('/', (req, res) => {
  res.send('Xeno Ingestion Service is Running 🚀');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});