import { prisma } from "../lib/prisma";

export const getTypeList = async (options: any) => {
  return prisma.type.findMany(options);
};