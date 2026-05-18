import { prisma } from "../lib/prisma";


export const createOneProduct = async (postData: any) => {
  const data: any = {
    title: postData.title,
    content: postData.content,
    body: postData.body,
    image: postData.image,
    author: {
      connect: {
        id: postData.authorId,
      },
    },
    category: {
      connectOrCreate: {
        where: { name: postData.category },
        create: { name: postData.category },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: postData.type },
        create: { name: postData.type },
      },
    },
  };

  if (postData.tags && postData.tags.length > 0) {
    data.tags = {
      connectOrCreate: postData.tags.map((tagName) => ({
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

export const updateOneProduct = async (id: number, postData: any) => {
  const data: any = {
    title: postData.title,
    content: postData.content,
    body: postData.body,
    image: postData.image,
    category: {
      connectOrCreate: {
        where: { name: postData.category },
        create: { name: postData.category },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: postData.type },
        create: { name: postData.type },
      },
    },
  };

  if (postData.image) {
    data.image = postData.image;
  }

  if (postData.tags && postData.tags.length > 0) {
    data.tags = {
      set: [],
      connectOrCreate: postData.tags.map((tagName) => ({
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
      title: true,
      content: true,
      body: true,
      image: true,
      updatedAt: true,
      author: {
        select: {
          fullName: true,
        },
      },
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
    },
  });
};

export const getProductsList = async (options: any) => {
  return prisma.product.findMany(options);
};
