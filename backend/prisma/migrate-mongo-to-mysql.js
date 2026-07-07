require('dotenv').config({ quiet: true });

const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const {
  AdminRole,
  CarouselStatus,
  NotificationType,
  PostLiveStatus,
  PostStatus,
  PostVideoSource,
  PrismaClient,
} = require('@prisma/client');
const mongoose = require('mongoose');

const CONFIRM_VALUE = 'I_UNDERSTAND_THIS_WRITES_TO_MYSQL';
const LEGACY_MONGO_CAROUSEL_COLLECTION = 'ads';

function readRequiredEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

function assertLocalDatabaseUrl(name, value, allowRemoteFlag) {
  const parsed = new URL(value);
  const host = parsed.hostname.toLowerCase();
  const isLocal =
    host === 'localhost' || host === '127.0.0.1' || host === '::1';

  if (!isLocal && process.env[allowRemoteFlag] !== 'true') {
    throw new Error(
      `${name} points to ${host}. Set ${allowRemoteFlag}=true only after confirming this is not production.`,
    );
  }
}

function toId(value) {
  return value ? value.toString() : null;
}

function toDate(value, fallback = new Date()) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function toNullableDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toStringOrDefault(value, fallback) {
  return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}

function toAdminRole(value) {
  return value === AdminRole.SUPER_ADMIN ? AdminRole.SUPER_ADMIN : AdminRole.ADMIN;
}

function toPostStatus(value) {
  if (value === PostStatus.published) return PostStatus.published;
  if (value === PostStatus.expired) return PostStatus.expired;
  return PostStatus.draft;
}

function toPostVideoSource(doc) {
  if (doc.facebookUrl) return PostVideoSource.FACEBOOK;
  if (doc.youtubeUrl || doc.youtubeVideoId) return PostVideoSource.YOUTUBE;
  return null;
}

function toPostLiveStatus(doc) {
  if (doc.liveStatus && PostLiveStatus[doc.liveStatus]) {
    return PostLiveStatus[doc.liveStatus];
  }
  return doc.isLive === true ? PostLiveStatus.LIVE : PostLiveStatus.UNKNOWN;
}

function toCarouselStatus(value) {
  if (value === CarouselStatus.active) return CarouselStatus.active;
  if (value === CarouselStatus.inactive) return CarouselStatus.inactive;
  if (value === CarouselStatus.expired) return CarouselStatus.expired;
  return CarouselStatus.pending;
}

function toNotificationType(value) {
  const legacyCarouselTypes = {
    AD_CREATED: NotificationType.CAROUSEL_CREATED,
    AD_UPDATED: NotificationType.CAROUSEL_UPDATED,
    AD_DELETED: NotificationType.CAROUSEL_DELETED,
    AD_TOGGLED: NotificationType.CAROUSEL_TOGGLED,
    AD_EXPIRING: NotificationType.CAROUSEL_EXPIRING,
  };

  if (legacyCarouselTypes[value]) return legacyCarouselTypes[value];

  return Object.values(NotificationType).includes(value)
    ? value
    : NotificationType.NEW_POST;
}

async function readCollection(database, name) {
  return database.collection(name).find({}).toArray();
}

async function migrateAdmins(prisma, database) {
  const docs = await readCollection(database, 'admins');
  let migrated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const id = toId(doc._id);
    if (!id || !doc.username || !doc.password) {
      skipped += 1;
      continue;
    }

    const identityConflict = await prisma.admin.findFirst({
      where: {
        username: doc.username,
        NOT: { id },
      },
      select: { id: true },
    });

    if (identityConflict) {
      skipped += 1;
      continue;
    }

    await prisma.admin.upsert({
      where: { id },
      update: {
        username: doc.username,
        password: doc.password,
        displayName: toStringOrDefault(doc.displayName, 'Admin'),
        isActive: doc.isActive !== false,
        lastLogin: toNullableDate(doc.lastLogin),
        role: toAdminRole(doc.role),
        createdAt: toDate(doc.createdAt),
        updatedAt: toDate(doc.updatedAt),
      },
      create: {
        id,
        username: doc.username,
        password: doc.password,
        displayName: toStringOrDefault(doc.displayName, 'Admin'),
        isActive: doc.isActive !== false,
        lastLogin: toNullableDate(doc.lastLogin),
        role: toAdminRole(doc.role),
        createdAt: toDate(doc.createdAt),
        updatedAt: toDate(doc.updatedAt),
      },
    });
    migrated += 1;
  }

  return { migrated, skipped };
}

async function adminExists(prisma, id) {
  if (!id) return false;
  const admin = await prisma.admin.findUnique({
    where: { id },
    select: { id: true },
  });
  return Boolean(admin);
}

async function migratePosts(prisma, database) {
  const docs = await readCollection(database, 'posts');
  let migrated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const id = toId(doc._id);
    if (!id || !doc.title || !doc.description) {
      skipped += 1;
      continue;
    }

    const authorId = toId(doc.author);
    const author = (await adminExists(prisma, authorId)) ? authorId : null;
    await prisma.post.upsert({
      where: { id },
      update: {
        title: doc.title,
        description: doc.description,
        mainImage: toStringOrDefault(doc.mainImage, ''),
        videoSource: toPostVideoSource(doc),
        youtubeUrl: doc.youtubeUrl || null,
        youtubeVideoId: doc.youtubeVideoId || null,
        facebookUrl: doc.facebookUrl || null,
        profileName: toStringOrDefault(doc.profileName, 'Radio Yeraz'),
        eventDate: toNullableDate(doc.eventDate),
        eventTime: doc.eventTime || null,
        location: doc.location || null,
        isLive: doc.isLive === true,
        liveStatus: toPostLiveStatus(doc),
        liveStatusCheckedAt: toNullableDate(doc.liveStatusCheckedAt),
        isPublished: doc.isPublished === true,
        status: toPostStatus(doc.status),
        postedDate: toDate(doc.postedDate),
        authorId: author,
        link: doc.link || null,
        createdAt: toDate(doc.createdAt),
        updatedAt: toDate(doc.updatedAt),
        expiresAt: toNullableDate(doc.expiresAt),
        reminderSentAt: toNullableDate(doc.reminderSentAt),
      },
      create: {
        id,
        title: doc.title,
        description: doc.description,
        mainImage: toStringOrDefault(doc.mainImage, ''),
        videoSource: toPostVideoSource(doc),
        youtubeUrl: doc.youtubeUrl || null,
        youtubeVideoId: doc.youtubeVideoId || null,
        facebookUrl: doc.facebookUrl || null,
        profileName: toStringOrDefault(doc.profileName, 'Radio Yeraz'),
        eventDate: toNullableDate(doc.eventDate),
        eventTime: doc.eventTime || null,
        location: doc.location || null,
        isLive: doc.isLive === true,
        liveStatus: toPostLiveStatus(doc),
        liveStatusCheckedAt: toNullableDate(doc.liveStatusCheckedAt),
        isPublished: doc.isPublished === true,
        status: toPostStatus(doc.status),
        postedDate: toDate(doc.postedDate),
        authorId: author,
        link: doc.link || null,
        createdAt: toDate(doc.createdAt),
        updatedAt: toDate(doc.updatedAt),
        expiresAt: toNullableDate(doc.expiresAt),
        reminderSentAt: toNullableDate(doc.reminderSentAt),
      },
    });
    migrated += 1;
  }

  return { migrated, skipped };
}

async function migrateCarousels(prisma, database) {
  const docs = await readCollection(database, LEGACY_MONGO_CAROUSEL_COLLECTION);
  let migrated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const id = toId(doc._id);
    if (!id || !doc.name) {
      skipped += 1;
      continue;
    }

    const authorId = toId(doc.author);
    const author = (await adminExists(prisma, authorId)) ? authorId : null;

    await prisma.carousel.upsert({
      where: { id },
      update: {
        image: toStringOrDefault(doc.image, ''),
        isActive: doc.isActive !== false,
        status: toCarouselStatus(doc.status),
        clicks: Number.isInteger(doc.clicks) ? doc.clicks : 0,
        startDate: toDate(doc.startDate),
        endDate: toNullableDate(doc.endDate),
        authorId: author,
        targetUrl: doc.targetUrl || null,
        name: doc.name,
        displayOrder: Number.isInteger(doc.displayOrder) ? doc.displayOrder : 0,
        createdAt: toDate(doc.createdAt),
        updatedAt: toDate(doc.updatedAt),
      },
      create: {
        id,
        image: toStringOrDefault(doc.image, ''),
        isActive: doc.isActive !== false,
        status: toCarouselStatus(doc.status),
        clicks: Number.isInteger(doc.clicks) ? doc.clicks : 0,
        startDate: toDate(doc.startDate),
        endDate: toNullableDate(doc.endDate),
        authorId: author,
        targetUrl: doc.targetUrl || null,
        name: doc.name,
        displayOrder: Number.isInteger(doc.displayOrder) ? doc.displayOrder : 0,
        createdAt: toDate(doc.createdAt),
        updatedAt: toDate(doc.updatedAt),
      },
    });
    migrated += 1;
  }

  return { migrated, skipped };
}

async function migrateStreamLinks(prisma, database) {
  const docs = await readCollection(database, 'streamlinks');
  let migrated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const id = toId(doc._id);
    if (!id || !doc.title || !doc.url) {
      skipped += 1;
      continue;
    }

    await prisma.streamLink.upsert({
      where: { id },
      update: {
        title: doc.title,
        url: doc.url,
        metadataUrl: doc.metadataUrl || doc.metaUrl || null,
        description: doc.description || null,
        bitrate: Number.isInteger(doc.bitrate) ? doc.bitrate : null,
        displayOrder: Number.isInteger(doc.displayOrder) ? doc.displayOrder : 0,
        isActive: doc.isActive !== false,
        createdAt: toDate(doc.createdAt),
        updatedAt: toDate(doc.updatedAt),
      },
      create: {
        id,
        title: doc.title,
        url: doc.url,
        metadataUrl: doc.metadataUrl || doc.metaUrl || null,
        description: doc.description || null,
        bitrate: Number.isInteger(doc.bitrate) ? doc.bitrate : null,
        displayOrder: Number.isInteger(doc.displayOrder) ? doc.displayOrder : 0,
        isActive: doc.isActive !== false,
        createdAt: toDate(doc.createdAt),
        updatedAt: toDate(doc.updatedAt),
      },
    });
    migrated += 1;
  }

  return { migrated, skipped };
}

async function migrateNotifications(prisma, database) {
  const docs = await readCollection(database, 'notifications');
  let migrated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const id = toId(doc._id);
    if (!id || !doc.title || !doc.message) {
      skipped += 1;
      continue;
    }

    await prisma.notification.upsert({
      where: { id },
      update: {
        title: doc.title,
        message: doc.message,
        type: toNotificationType(doc.type),
        data: doc.data || null,
        isRead: doc.isRead === true,
        postId: doc.postId || null,
        authorName: doc.authorName || null,
        createdAt: toDate(doc.createdAt),
        updatedAt: toDate(doc.updatedAt),
      },
      create: {
        id,
        title: doc.title,
        message: doc.message,
        type: toNotificationType(doc.type),
        data: doc.data || null,
        isRead: doc.isRead === true,
        postId: doc.postId || null,
        authorName: doc.authorName || null,
        createdAt: toDate(doc.createdAt),
        updatedAt: toDate(doc.updatedAt),
      },
    });
    migrated += 1;
  }

  return { migrated, skipped };
}

async function migrateRefreshTokens(prisma, database) {
  const docs = await readCollection(database, 'refresh_tokens');
  let migrated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const id = toId(doc._id);
    const adminId = toId(doc.admin);
    if (!id || !doc.token || !(await adminExists(prisma, adminId))) {
      skipped += 1;
      continue;
    }

    await prisma.refreshToken.upsert({
      where: { id },
      update: {
        token: doc.token,
        adminId,
        expiresAt: toDate(doc.expiresAt),
        isRevoked: doc.isRevoked === true,
        createdAt: toDate(doc.createdAt),
        updatedAt: toDate(doc.updatedAt),
      },
      create: {
        id,
        token: doc.token,
        adminId,
        expiresAt: toDate(doc.expiresAt),
        isRevoked: doc.isRevoked === true,
        createdAt: toDate(doc.createdAt),
        updatedAt: toDate(doc.updatedAt),
      },
    });
    migrated += 1;
  }

  return { migrated, skipped };
}

async function main() {
  if (process.env.MONGO_TO_MYSQL_CONFIRM !== CONFIRM_VALUE) {
    throw new Error(
      `Set MONGO_TO_MYSQL_CONFIRM=${CONFIRM_VALUE} to run this write migration.`,
    );
  }

  const databaseUrl = readRequiredEnv('DATABASE_URL');
  const mongodbUri = readRequiredEnv('MONGODB_URI');
  assertLocalDatabaseUrl(
    'DATABASE_URL',
    databaseUrl,
    'ALLOW_REMOTE_MYSQL_MIGRATION',
  );
  assertLocalDatabaseUrl(
    'MONGODB_URI',
    mongodbUri,
    'ALLOW_REMOTE_MONGO_MIGRATION',
  );

  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
  });

  await mongoose.connect(mongodbUri);

  try {
    const database = mongoose.connection.db;
    if (!database) {
      throw new Error('MongoDB connection did not expose a database handle.');
    }

    const results = {
      admins: await migrateAdmins(prisma, database),
      streamLinks: await migrateStreamLinks(prisma, database),
      posts: await migratePosts(prisma, database),
      carousels: await migrateCarousels(prisma, database),
      notifications: await migrateNotifications(prisma, database),
      refreshTokens: await migrateRefreshTokens(prisma, database),
    };

    console.log(JSON.stringify(results, null, 2));
  } finally {
    await prisma.$disconnect();
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
