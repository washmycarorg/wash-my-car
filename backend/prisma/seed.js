import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const services = [
    { id: 1, name: 'Basic Wash', description: 'Exterior wash & dry', price: 25, type: 'Basic' },
    { id: 2, name: 'Premium Wash', description: 'Exterior + interior vacuum + tyre shine', price: 45, type: 'Premium' },
    { id: 3, name: 'Full Detailing', description: 'Full interior & exterior detailing, polish & wax', price: 120, type: 'Full' }
  ];

  for (const s of services) {
    const exists = await prisma.service.findUnique({ where: { id: s.id } });
    if (!exists) {
      await prisma.service.create({ data: s });
    }
  }
  console.log('Services seeded successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
