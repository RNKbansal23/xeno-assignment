const { PrismaClient } = require('@prisma/client');
require('dotenv').config(); // <--- THIS LINE IS CRITICAL to read the .env file!

const prisma = new PrismaClient();

async function main() {
  // Read the token from the .env file
  const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
  const SHOP_DOMAIN = 'rnk-bansal-devstore.myshopify.com'; // Your actual domain

  // Safety check
  if (!ACCESS_TOKEN) {
    throw new Error("❌ Error: SHOPIFY_ACCESS_TOKEN is missing in .env file");
  }

  console.log(`Seeding tenant: ${SHOP_DOMAIN}...`);

  const tenant = await prisma.tenant.upsert({
    where: { shopDomain: SHOP_DOMAIN },
    update: {
        accessToken: ACCESS_TOKEN, // Update token if it changed
    }, 
    create: {
      storeName: 'My Dev Store',
      shopDomain: SHOP_DOMAIN,
      accessToken: ACCESS_TOKEN,
      password: 'xeno123'
    },
  });

  console.log('✅ Tenant Created:', tenant);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());