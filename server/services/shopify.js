// server/services/shopify.js
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_VERSION = '2024-01'; // Shopify API Version

/**
 * Helper to get Shopify headers
 */
const getHeaders = (accessToken) => ({
  'X-Shopify-Access-Token': accessToken,
  'Content-Type': 'application/json',
});

/**
 * 1. Sync Customers
 */
async function syncCustomers(tenant) {
  try {
    const url = `https://${tenant.shopDomain}/admin/api/${API_VERSION}/customers.json`;
    const response = await axios.get(url, { headers: getHeaders(tenant.accessToken) });
    const customers = response.data.customers;

    console.log(`Found ${customers.length} customers for ${tenant.storeName}`);

    for (const cust of customers) {
      await prisma.customer.upsert({
        where: {
          shopifyCustomerId_tenantId: {
            shopifyCustomerId: String(cust.id),
            tenantId: tenant.id,
          },
        },
        update: {
          totalSpent: cust.total_spent,
          firstName: cust.first_name,
          lastName: cust.last_name,
          email: cust.email,
        },
        create: {
          shopifyCustomerId: String(cust.id),
          tenantId: tenant.id,
          email: cust.email,
          firstName: cust.first_name,
          lastName: cust.last_name,
          totalSpent: cust.total_spent || 0,
        },
      });
    }
  } catch (error) {
    console.error(`Error syncing customers for ${tenant.storeName}:`, error.message);
  }
}

/**
 * 2. Sync Products
 */
async function syncProducts(tenant) {
  try {
    const url = `https://${tenant.shopDomain}/admin/api/${API_VERSION}/products.json`;
    const response = await axios.get(url, { headers: getHeaders(tenant.accessToken) });
    const products = response.data.products;

    console.log(`Found ${products.length} products for ${tenant.storeName}`);

    for (const prod of products) {
      await prisma.product.upsert({
        where: {
          shopifyProductId_tenantId: {
            shopifyProductId: String(prod.id),
            tenantId: tenant.id,
          },
        },
        update: { title: prod.title },
        create: {
          shopifyProductId: String(prod.id),
          title: prod.title,
          tenantId: tenant.id,
        },
      });
    }
  } catch (error) {
    console.error(`Error syncing products for ${tenant.storeName}:`, error.message);
  }
}

/**
 * 3. Sync Orders (Links to Customer)
 */
/**
 * 3. Sync Orders (Links to Customer & Updates Total Spent)
 */
async function syncOrders(tenant) {
  try {
    const url = `https://${tenant.shopDomain}/admin/api/${API_VERSION}/orders.json?status=any`;
    const response = await axios.get(url, { headers: getHeaders(tenant.accessToken) });
    const orders = response.data.orders;

    console.log(`Found ${orders.length} orders for ${tenant.storeName}`);

    for (const order of orders) {
      let dbCustomerId = null;
      
      // 1. Find the Customer in our DB
      if (order.customer) {
        const dbCustomer = await prisma.customer.findUnique({
          where: {
            shopifyCustomerId_tenantId: {
              shopifyCustomerId: String(order.customer.id),
              tenantId: tenant.id,
            },
          },
        });
        if (dbCustomer) dbCustomerId = dbCustomer.id;
      }

      // 2. Save the Order
      await prisma.order.upsert({
        where: {
          shopifyOrderId_tenantId: {
            shopifyOrderId: String(order.id),
            tenantId: tenant.id,
          },
        },
        update: {
          totalPrice: order.total_price,
          customerId: dbCustomerId,
        },
        create: {
          shopifyOrderId: String(order.id),
          totalPrice: order.total_price,
          currency: order.currency,
          createdAt: new Date(order.created_at),
          tenantId: tenant.id,
          customerId: dbCustomerId,
        },
      });

      // 3. MANUAL FIX: Update Customer "Total Spent" immediately
      // We don't wait for Shopify to calculate it. We do it ourselves.
      if (dbCustomerId) {
        // Calculate sum of all orders for this customer in our DB
        const aggregate = await prisma.order.aggregate({
          _sum: { totalPrice: true },
          where: { customerId: dbCustomerId }
        });

        // Update the customer record
        await prisma.customer.update({
          where: { id: dbCustomerId },
          data: { totalSpent: aggregate._sum.totalPrice || 0 }
        });
        console.log(`💰 Updated Customer ${dbCustomerId} total spent to: ${aggregate._sum.totalPrice}`);
      }
    }
  } catch (error) {
    console.error(`Error syncing orders for ${tenant.storeName}:`, error.message);
  }
}

/**
 * MAIN FUNCTION: Runs everything for one tenant
 */
async function syncAllData(tenantId) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return console.error('Tenant not found');

  console.log(`🔄 Starting Sync for: ${tenant.storeName}`);
  
  // Order matters: Customers/Products first, Orders last (because Orders link to Customers)
  await syncCustomers(tenant);
  await syncProducts(tenant);
  await syncOrders(tenant);

  console.log(`✅ Sync Complete for: ${tenant.storeName}`);
}

module.exports = { syncAllData };