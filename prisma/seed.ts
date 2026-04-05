import { Prisma } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
import * as bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";
// const userData: Prisma.UserCreateInput[] = [
//   {
//     phone_no: "+1234567891",
//     password: "",
//     randToken: "randomtoken123",
//   }
// ];

export function createRandomUser() {
  return {
    phone_no: faker.phone.number({style: "international"}),
    password: "",
    randToken: faker.internet.jwt()
  };
}

export const userData = faker.helpers.multiple(createRandomUser, {
  count: 5,
});

async function main() {
  console.log(`Start seeding ...`);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password", salt);
  for (const u of userData) {
    u.password = hashedPassword;
    const user = await prisma.user.create({
      data: u,
    });
    console.log(`Created user with id: ${user.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
