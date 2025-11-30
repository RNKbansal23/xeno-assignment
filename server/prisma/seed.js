const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // REPLACE THESE WITH YOUR ACTUAL VALUES FROM DAY 1
  const SHOP_DOMAIN = 'rnk-bansal-devstore.myshopify.com'; 
  if (!ACCESS_TOKEN) {
  throw new Error("Missing SHOPIFY_ACCESS_TOKEN in .env file");
}

  console.log(`Seeding tenant: ${SHOP_DOMAIN}...`);

  const tenant = await prisma.tenant.upsert({
    where: { shopDomain: SHOP_DOMAIN },
    update: {}, // If exists, do nothing
    create: {
      storeName: 'My Dev Store',
      shopDomain: SHOP_DOMAIN,
      accessToken: ACCESS_TOKEN,
    },
  });

  console.log('✅ Tenant Created:', tenant);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());