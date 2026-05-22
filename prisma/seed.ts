import { prisma } from "../src/lib/prisma";
import * as bcrypt from "bcrypt";
import { Role, Status } from "../src/generated/prisma/client";
import { copyFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { posts } from "./seederdata/posts";
import { filterList, products } from "./seederdata/products";
import { User } from "./seederdata/user";

const seedPassword = "password";
const seedEmailDomain = "seed.furniture.local";
// Product fixtures are chair records and only carry a category reference.
const defaultProductTypeId = filterList.types[0]?.id;
const dataImageDirectory = path.join(process.cwd(), "prisma/seederdata/images");
const uploadedImageDirectory = path.join(process.cwd(), "uploads/images");
const optimizedImageDirectory = path.join(
  process.cwd(),
  "uploads/optimize_img",
);

const unique = <T>(values: T[]) => [...new Set(values)];

const normalize = (value: string) => value.trim().toLowerCase();

const toSlug = (value: string) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const splitName = (fullName: string) => {
  const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/);

  return {
    firstName: firstName || fullName,
    lastName: lastNameParts.join(" ") || null,
  };
};

const statusFromFixture = (status: string) =>
  normalize(status) === "active" ? Status.ACTIVE : Status.INACTIVE;

const optimizedFileName = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, ".webp");

const findFixtureRef = <T extends { id: string; label: string }>(
  refs: T[],
  label: string,
  refName: string,
) => {
  const ref = refs.find((item) => normalize(item.label) === normalize(label));

  if (!ref) {
    throw new Error(`Missing ${refName} fixture for "${label}".`);
  }

  return ref;
};

const fixtureImages = unique([
  ...posts.map((post) => post.image),
  ...products.flatMap((product) => product.images),
]);

const productImagePaths = unique(
  products.flatMap((product) => product.images),
);

const copyFixtureImages = async () => {
  await mkdir(uploadedImageDirectory, { recursive: true });
  await mkdir(optimizedImageDirectory, { recursive: true });

  await Promise.all(
    fixtureImages.map(async (fileName) => {
      const sourceFile = path.join(dataImageDirectory, fileName);

      await copyFile(sourceFile, path.join(uploadedImageDirectory, fileName));
      await sharp(sourceFile)
        .resize(835, 577, { fit: "cover" })
        .webp({ quality: 100 })
        .toFile(path.join(optimizedImageDirectory, optimizedFileName(fileName)));
    }),
  );
};

async function main() {
  console.log(`Start seeding ...`);

  if (!defaultProductTypeId) {
    throw new Error("At least one product type fixture is required.");
  }

  await copyFixtureImages();

  const hashedPassword = await bcrypt.hash(seedPassword, 10);
  const primaryUser = await prisma.user.upsert({
    where: { email: User.email },
    update: {
      firstName: User.firstName,
      lastName: User.lastName,
      phone_no: "+959700000001",
      password: hashedPassword,
      randToken: "seed-primary-user-token",
      role: Role.USER,
      status: Status.ACTIVE,
    },
    create: {
      email: User.email,
      firstName: User.firstName,
      lastName: User.lastName,
      phone_no: "+959700000001",
      password: hashedPassword,
      randToken: "seed-primary-user-token",
      role: Role.USER,
      status: Status.ACTIVE,
    },
  });

  const categoriesByFixtureId = new Map<number | string, { id: number }>();
  for (const category of filterList.categories) {
    const row = await prisma.category.upsert({
      where: { name: category.label },
      update: {},
      create: { name: category.label },
    });

    categoriesByFixtureId.set(category.id, row);
  }

  const typesByFixtureId = new Map<number | string, { id: number }>();
  for (const type of filterList.types) {
    const row = await prisma.type.upsert({
      where: { name: type.label },
      update: {},
      create: { name: type.label },
    });

    typesByFixtureId.set(type.id, row);
  }

  await prisma.post.deleteMany({
    where: {
      image: {
        in: posts.map((post) => post.image),
      },
    },
  });

  await prisma.product.deleteMany({
    where: {
      images: {
        some: {
          path: {
            in: productImagePaths,
          },
        },
      },
    },
  });

  const authorNames = unique(posts.map((post) => post.author));
  const authors = new Map<string, { id: number }>();
  for (const [index, authorName] of authorNames.entries()) {
    const { firstName, lastName } = splitName(authorName);
    const email = `${toSlug(authorName)}@${seedEmailDomain}`;
    const author = await prisma.user.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        phone_no: `+9597000001${String(index).padStart(2, "0")}`,
        password: hashedPassword,
        randToken: `seed-author-${toSlug(authorName)}`,
        role: Role.AUTHOR,
        status: Status.ACTIVE,
      },
      create: {
        email,
        firstName,
        lastName,
        phone_no: `+9597000001${String(index).padStart(2, "0")}`,
        password: hashedPassword,
        randToken: `seed-author-${toSlug(authorName)}`,
        role: Role.AUTHOR,
        status: Status.ACTIVE,
      },
    });

    authors.set(authorName, author);
  }

  for (const product of products) {
    const category = categoriesByFixtureId.get(product.categoryId);
    const type = typesByFixtureId.get(defaultProductTypeId);

    if (!category || !type) {
      throw new Error(`Product fixture "${product.name}" has invalid filters.`);
    }

    await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: product.price,
        discount: product.discount,
        rating: Math.round(product.rating),
        inventory: product.inventory,
        status: statusFromFixture(product.status),
        category: { connect: { id: category.id } },
        type: { connect: { id: type.id } },
        images: {
          create: product.images.map((image) => ({ path: image })),
        },
      },
    });
  }

  for (const post of posts) {
    const categoryRef = findFixtureRef(
      filterList.categories,
      post.tags[0] || "",
      "post category",
    );
    const typeRef = findFixtureRef(
      filterList.types,
      post.tags[1] || "",
      "post type",
    );
    const author = authors.get(post.author);
    const category = categoriesByFixtureId.get(categoryRef.id);
    const type = typesByFixtureId.get(typeRef.id);

    if (!author || !category || !type) {
      throw new Error(`Post fixture "${post.title}" has invalid relations.`);
    }

    const updatedAt = new Date(post.updated_at);

    await prisma.post.create({
      data: {
        title: post.title,
        content: post.content,
        body: post.body,
        image: post.image,
        published: true,
        createdAt: updatedAt,
        updatedAt,
        author: { connect: { id: author.id } },
        category: { connect: { id: category.id } },
        type: { connect: { id: type.id } },
        tags: {
          connectOrCreate: post.tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
    });
  }

  console.log(
    `Seeded ${1 + authors.size} users, ${products.length} products, and ${posts.length} posts.`,
  );
  console.log(`Sample user: ${primaryUser.email} / ${seedPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
