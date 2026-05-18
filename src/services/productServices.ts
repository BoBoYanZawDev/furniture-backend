import { prisma } from "../lib/prisma";

export const createOneProduct = async (productData: any) => {
  const data: any = {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    discount: productData.discount,
    inventory: productData.inventory,
    category: {
      connectOrCreate: {
        where: { name: productData.category },
        create: { name: productData.category },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: productData.type },
        create: { name: productData.type },
      },
    },
    images: {
      create: productData.images,
    },
  };

  if (productData.tags && productData.tags.length > 0) {
    data.tags = {
      connectOrCreate: productData.tags.map((tagName: any) => ({
        where: { name: tagName },
        create: { name: tagName },
      })),
    };
  }
  return prisma.product.create({ data });
};

export const getProductById = async (id: number) => {
  return prisma.product.findUnique({
    where: { id },
  });
};

export const updateOneProduct = async (id: number, productData: any) => {
  const data: any = {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    discount: productData.discount,
    inventory: productData.inventory,
    category: {
      connectOrCreate: {
        where: { name: productData.category },
        create: { name: productData.category },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: productData.type },
        create: { name: productData.type },
      },
    },
  };

  if (productData.images && productData.images.length > 0) {
    data.images = {
      deleteMany: {},
      create: data.images,
    };
  }

  if (productData.tags && productData.tags.length > 0) {
    data.tags = {
      set: [],
      connectOrCreate: productData.tags.map((tagName: any) => ({
        where: { name: tagName },
        create: { name: tagName },
      })),
    };
  }

  return prisma.product.update({ where: { id }, data });
};

export const deleteOneProduct = async (id: number) => {
  return prisma.product.delete({
    where: { id },
  });
};

export const getProductWithRelations = async (id: number) => {
  return prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      discount: true,
      rating: true,
      inventory: true,
      updatedAt: true,
      category: {
        select: {
          name: true,
        },
      },
      type: {
        select: {
          name: true,
        },
      },
      tags: {
        select: {
          name: true,
        },
      },
      images: {
        select: {
          path: true,
        },
      },
    },
  });
};

export const getProductsList = async (options: any) => {
  return prisma.product.findMany(options);
};
