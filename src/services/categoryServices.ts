import { prisma } from "../lib/prisma";

export const getCategoryList = async (options: any) => {
  return prisma.category.findMany(options);
};