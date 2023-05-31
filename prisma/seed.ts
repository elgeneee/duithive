import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const categories = [
    {
      name: "Restaurants",
      iconId: 1,
    },
    {
      name: "Shopping",
      iconId: 2,
    },
    {
      name: "Sports",
      iconId: 3,
    },
    {
      name: "Transport",
      iconId: 4,
    },
    {
      name: "Groceries",
      iconId: 5,
    },
    {
      name: "Entertainment",
      iconId: 6,
    },
    {
      name: "Auto",
      iconId: 7,
    },
  ];
  // const currencies = [
  //   { name: "USD", symbol: "$" },
  //   { name: "EUR", symbol: "€" },
  //   { name: "GBP", symbol: "£" },
  //   { name: "JPY", symbol: "¥" },
  //   { name: "DZD", symbol: "DZD" },
  //   { name: "AUD", symbol: "$" },
  //   { name: "NZD", symbol: "$" },
  //   { name: "THB", symbol: "฿" },
  //   { name: "TWD", symbol: "NT$" },
  //   { name: "CAD", symbol: "$" },
  //   { name: "CNY", symbol: "¥" },
  //   { name: "IDR", symbol: "Rp" },
  //   { name: "INR", symbol: "₹" },
  //   { name: "KRW", symbol: "₩" },
  //   { name: "PHP", symbol: "₱" },
  //   { name: "SGD", symbol: "$" },
  // ];
  // for (const currency of currencies) {
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  //   await prisma.currency.create({
  //     data: currency,
  //   });
  // }

  // for (const category of categories) {
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  //   await prisma.category.create({
  //     data: category,
  //   });
  // }

  const existingCategory = await prisma.category.findFirst({
    where: {
      name: "Restaurants",
      iconId: 4,
    },
  });
  console.log(existingCategory);

  // await prisma.expense.deleteMany({});
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
