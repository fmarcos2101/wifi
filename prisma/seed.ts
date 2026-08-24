import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    { name: "1 hora", hours: 1, priceCents: 500, sortOrder: 1 },
    { name: "3 horas", hours: 3, priceCents: 1000, sortOrder: 2 },
    { name: "6 horas", hours: 6, priceCents: 1500, sortOrder: 3 },
    { name: "24 horas", hours: 24, priceCents: 2500, sortOrder: 4 },
  ];

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({
      where: { hours: plan.hours },
    });
    if (existing) {
      await prisma.plan.update({
        where: { id: existing.id },
        data: plan,
      });
    } else {
      await prisma.plan.create({ data: plan });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
