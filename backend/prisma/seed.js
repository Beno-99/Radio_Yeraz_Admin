require('dotenv').config({ quiet: true });

const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient, AdminRole } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomBytes } = require('crypto');

function createObjectIdString() {
  return randomBytes(12).toString('hex');
}

function readRequiredEnv(name, options = { trim: true }) {
  const value = process.env[name];

  if (value === undefined || value === '') {
    throw new Error(`${name} is required for database seeding.`);
  }

  const normalized = options.trim ? value.trim() : value;
  if (normalized === '') {
    throw new Error(`${name} cannot be empty.`);
  }

  return normalized;
}

async function main() {
  const databaseUrl = readRequiredEnv('DATABASE_URL', { trim: false });
  const username = readRequiredEnv('SEED_ADMIN_USERNAME');
  const displayName = readRequiredEnv('SEED_ADMIN_DISPLAY_NAME');
  const password = readRequiredEnv('SEED_ADMIN_PASSWORD', { trim: false });
  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
  });

  try {
    const existingByUsername = await prisma.admin.findUnique({
      where: { username },
    });

    if (existingByUsername) {
      if (
        existingByUsername.role === AdminRole.SUPER_ADMIN &&
        existingByUsername.isActive
      ) {
        console.log(
          'Seed skipped: an active SUPER_ADMIN already exists for the configured username.',
        );
        return;
      }

      throw new Error(
        'Seed skipped: an admin already exists with the configured username. No password was changed.',
      );
    }

    const activeSuperAdmin = await prisma.admin.findFirst({
      where: {
        role: AdminRole.SUPER_ADMIN,
        isActive: true,
      },
    });

    if (activeSuperAdmin) {
      console.log(
        'Seed skipped: an active SUPER_ADMIN already exists. No duplicate was created.',
      );
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.admin.create({
      data: {
        id: createObjectIdString(),
        username,
        password: hashedPassword,
        displayName,
        role: AdminRole.SUPER_ADMIN,
        isActive: true,
      },
    });

    console.log('Seed completed: initial SUPER_ADMIN account created.');
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
