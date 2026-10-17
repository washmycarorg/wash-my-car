import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password', 10);

  const employees = await prisma.employee.findMany();
  console.log(`Found ${employees.length} employees in database.`);

  for (const emp of employees) {
    console.log(`Updating employee ID ${emp.id} (${emp.name}, ${emp.phone}, ${emp.email})...`);
    await prisma.employee.update({
      where: { id: emp.id },
      data: { password: hashedPassword }
    });
  }

  console.log(`Successfully updated passwords to "password" for all ${employees.length} employees.`);
}

main()
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
