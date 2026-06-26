require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');
const bcrypt = require('bcrypt');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient, AdminRole } = require('@prisma/client');

const API_BASE_URL = (process.env.SMOKE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const APP_BASE_URL = (process.env.SMOKE_APP_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const runId = `smoke-${Date.now()}-${randomBytes(3).toString('hex')}`;
const testPassword = `SmokePass-${randomBytes(6).toString('hex')}!`;

function objectId() {
  return randomBytes(12).toString('hex');
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function makePrisma() {
  return new PrismaClient({
    adapter: new PrismaMariaDb(requiredEnv('DATABASE_URL')),
  });
}

const prisma = makePrisma();
const results = [];
const created = {
  admins: [],
  posts: [],
  ads: [],
  streamLinks: [],
  refreshTokens: [],
  files: [],
};

function record(name, details = '') {
  results.push({ name, details });
  console.log(`PASS ${name}${details ? ` - ${details}` : ''}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function api(pathname, options = {}) {
  const headers = {
    ...authHeaders(options.token),
    ...(options.headers || {}),
  };

  let body;
  if (options.form) {
    body = options.form;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${pathname}`, {
    method: options.method || 'GET',
    headers,
    body,
  });
  const data = await parseResponse(response);
  return { status: response.status, data, ok: response.ok };
}

async function expectStatus(name, requestPromise, expected) {
  const response = await requestPromise;
  const expectedStatuses = Array.isArray(expected) ? expected : [expected];
  assert(
    expectedStatuses.includes(response.status),
    `${name}: expected ${expectedStatuses.join('/')} but got ${response.status}`,
  );
  record(name, `status ${response.status}`);
  return response;
}

async function login(username, password, expected = 200) {
  const response = await expectStatus(
    `login ${username}`,
    api('/auth/login', {
      method: 'POST',
      body: { username, password },
    }),
    expected,
  );

  if (expected === 200) {
    assert(response.data?.success === true, 'login did not return success');
    assert(response.data?.data?.accessToken, 'login did not return access token');
    assert(response.data?.data?.refreshToken, 'login did not return refresh token');
  }

  return response.data?.data || {};
}

function addUploadedFile(relativePath) {
  if (!relativePath || !relativePath.startsWith('/uploads/')) return;
  created.files.push(path.join(process.cwd(), relativePath.replace(/^\//, '')));
}

async function cleanup() {
  for (const adId of created.ads.reverse()) {
    await api(`/ads/${adId}`, { method: 'DELETE', token: cleanup.superToken }).catch(() => undefined);
  }
  for (const postId of created.posts.reverse()) {
    await api(`/posts/${postId}`, { method: 'DELETE', token: cleanup.superToken }).catch(() => undefined);
  }
  for (const streamLinkId of created.streamLinks.reverse()) {
    await api(`/stream-links/${streamLinkId}`, { method: 'DELETE', token: cleanup.superToken }).catch(() => undefined);
  }
  for (const adminId of created.admins.reverse()) {
    await api(`/admin/${adminId}`, { method: 'DELETE', token: cleanup.superToken }).catch(() => undefined);
  }

  await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { id: { in: created.refreshTokens } },
        { token: { startsWith: runId } },
      ],
    },
  });
  await prisma.notification.deleteMany({
    where: {
      OR: [
        { title: { contains: runId } },
        { message: { contains: runId } },
        { authorName: { contains: runId } },
      ],
    },
  });
  await prisma.streamLink.deleteMany({ where: { title: { contains: runId } } });
  await prisma.post.deleteMany({ where: { title: { contains: runId } } });
  await prisma.ad.deleteMany({ where: { name: { contains: runId } } });
  await prisma.admin.deleteMany({ where: { username: { startsWith: runId } } });

  for (const filePath of created.files) {
    const resolved = path.resolve(filePath);
    const uploadsRoot = path.resolve(process.cwd(), 'uploads');
    if (resolved.startsWith(uploadsRoot) && fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
  }
}

function imageForm(fields = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) form.append(key, String(value));
  }
  form.append(
    'image',
    new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' }),
    `${runId}.png`,
  );
  return form;
}

function postForm(fields = {}, includeImage = false, includeVideo = false) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) form.append(key, String(value));
  }
  if (includeImage) {
    form.append(
      'mainImage',
      new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' }),
      `${runId}.png`,
    );
  }
  if (includeVideo) {
    form.append(
      'video',
      new Blob([Buffer.from('00000018667479706d703432', 'hex')], { type: 'video/mp4' }),
      `${runId}.mp4`,
    );
  }
  return form;
}

async function runAuthTests(seedUsername, seedPassword) {
  const superLogin = await login(seedUsername, seedPassword);
  cleanup.superToken = superLogin.accessToken;
  cleanup.superAdminId = superLogin.admin.id;

  await expectStatus('wrong username returns clean unauthorized', api('/auth/login', {
    method: 'POST',
    body: { username: `${runId}-missing`, password: seedPassword },
  }), 401);

  await expectStatus('wrong password returns clean unauthorized', api('/auth/login', {
    method: 'POST',
    body: { username: seedUsername, password: `${testPassword}-wrong` },
  }), 401);

  const inactiveUsername = `${runId}-inactive`;
  const inactivePassword = `${testPassword}-inactive`;
  const inactiveHash = await bcrypt.hash(inactivePassword, 10);
  const inactiveAdmin = await prisma.admin.create({
    data: {
      id: objectId(),
      username: inactiveUsername,
      password: inactiveHash,
      displayName: 'Smoke Inactive Admin',
      role: AdminRole.ADMIN,
      isActive: false,
    },
  });
  created.admins.push(inactiveAdmin.id);
  await login(inactiveUsername, inactivePassword, 401);

  const refreshRow = await prisma.refreshToken.findUnique({
    where: { token: superLogin.refreshToken },
  });
  assert(refreshRow, 'refresh token was not stored in MySQL');
  record('refresh token stored in MySQL');

  const rotated = await expectStatus('refresh token rotation succeeds', api('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: superLogin.refreshToken },
  }), 201);
  assert(rotated.data?.accessToken && rotated.data?.refreshToken, 'refresh did not return token pair');
  assert(rotated.data.refreshToken !== superLogin.refreshToken, 'refresh token did not rotate');

  await expectStatus('old refresh token invalid after rotation', api('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: superLogin.refreshToken },
  }), 401);
  await expectStatus('invalid refresh token rejected', api('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: `${runId}-invalid-refresh` },
  }), 401);

  const expiredToken = `${runId}-expired-refresh`;
  const expired = await prisma.refreshToken.create({
    data: {
      id: objectId(),
      token: expiredToken,
      adminId: cleanup.superAdminId,
      expiresAt: new Date(Date.now() - 60_000),
      isRevoked: false,
    },
  });
  created.refreshTokens.push(expired.id);
  await expectStatus('expired refresh token rejected', api('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: expiredToken },
  }), 401);

  const logoutLogin = await login(seedUsername, seedPassword);
  await expectStatus('logout succeeds', api('/auth/logout', {
    method: 'POST',
    body: { refreshToken: logoutLogin.refreshToken },
  }), 200);
  const loggedOutToken = await prisma.refreshToken.findUnique({
    where: { token: logoutLogin.refreshToken },
  });
  assert(loggedOutToken?.isRevoked === true, 'logout did not revoke refresh token');
  record('logout revokes refresh token in MySQL');

  const allA = await login(seedUsername, seedPassword);
  const allB = await login(seedUsername, seedPassword);
  await expectStatus('logout all devices succeeds', api('/auth/logout-all', {
    method: 'POST',
    token: allA.accessToken,
  }), 200);
  await expectStatus('logout-all invalidates first refresh token', api('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: allA.refreshToken },
  }), 401);
  await expectStatus('logout-all invalidates second refresh token', api('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: allB.refreshToken },
  }), 401);

  await expectStatus('protected route rejects missing token', api('/admin/profile'), 401);
  await expectStatus('protected route accepts valid token', api('/admin/profile', {
    token: rotated.data.accessToken,
  }), 200);

  return {
    accessToken: rotated.data.accessToken,
    refreshToken: rotated.data.refreshToken,
    adminId: cleanup.superAdminId,
  };
}

async function runAdminPermissionTests(superToken, seedAdminId) {
  const adminUsername = `${runId}-admin`;
  const createdAdmin = await expectStatus('SUPER_ADMIN creates normal ADMIN', api('/admin', {
    method: 'POST',
    token: superToken,
    body: {
      username: adminUsername,
      password: testPassword,
      displayName: 'Smoke Normal Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  }), 201);
  const adminId = createdAdmin.data.data._id || createdAdmin.data.data.id;
  created.admins.push(adminId);
  assert(createdAdmin.data.data.role === 'ADMIN', 'admin creation unexpectedly created SUPER_ADMIN');
  record('creating another SUPER_ADMIN through create endpoint is not allowed');

  const normalLogin = await login(adminUsername, testPassword);
  const normalToken = normalLogin.accessToken;

  await expectStatus('normal ADMIN cannot create admins', api('/admin', {
    method: 'POST',
    token: normalToken,
    body: { username: `${runId}-blocked`, password: testPassword },
  }), 403);
  await expectStatus('normal ADMIN cannot edit another admin', api(`/admin/${seedAdminId}`, {
    method: 'PUT',
    token: normalToken,
    body: { displayName: 'Blocked Edit' },
  }), 403);
  await expectStatus('normal ADMIN cannot delete another admin', api(`/admin/${seedAdminId}`, {
    method: 'DELETE',
    token: normalToken,
  }), 403);
  await expectStatus('normal ADMIN cannot toggle another admin', api(`/admin/${seedAdminId}/toggle-active`, {
    method: 'PUT',
    token: normalToken,
  }), 403);
  await expectStatus('normal ADMIN updates own permitted profile fields', api('/admin/profile', {
    method: 'PUT',
    token: normalToken,
    body: { displayName: 'Smoke Normal Admin Updated' },
  }), 200);
  await expectStatus('normal ADMIN cannot submit protected profile fields', api('/admin/profile', {
    method: 'PUT',
    token: normalToken,
    body: { role: 'SUPER_ADMIN', isActive: false },
  }), 400);

  await expectStatus('SUPER_ADMIN edits another admin', api(`/admin/${adminId}`, {
    method: 'PUT',
    token: superToken,
    body: { displayName: 'Smoke Edited Admin' },
  }), 200);
  await expectStatus('SUPER_ADMIN can promote another admin when explicitly editing', api(`/admin/${adminId}`, {
    method: 'PUT',
    token: superToken,
    body: { role: 'SUPER_ADMIN' },
  }), 200);
  await expectStatus('SUPER_ADMIN can demote another admin', api(`/admin/${adminId}`, {
    method: 'PUT',
    token: superToken,
    body: { role: 'ADMIN' },
  }), 200);
  await expectStatus('SUPER_ADMIN toggles another admin inactive', api(`/admin/${adminId}/toggle-active`, {
    method: 'PUT',
    token: superToken,
  }), 200);
  await expectStatus('SUPER_ADMIN toggles another admin active', api(`/admin/${adminId}/toggle-active`, {
    method: 'PUT',
    token: superToken,
  }), 200);

  const activeSuperAdmins = await prisma.admin.count({
    where: { role: AdminRole.SUPER_ADMIN, isActive: true },
  });
  if (activeSuperAdmins === 1) {
    await expectStatus('cannot demote final active SUPER_ADMIN', api(`/admin/${seedAdminId}`, {
      method: 'PUT',
      token: superToken,
      body: { role: 'ADMIN' },
    }), 400);
    await expectStatus('cannot deactivate final active SUPER_ADMIN', api(`/admin/${seedAdminId}/toggle-active`, {
      method: 'PUT',
      token: superToken,
    }), 400);
    await expectStatus('cannot delete final active SUPER_ADMIN', api(`/admin/${seedAdminId}`, {
      method: 'DELETE',
      token: superToken,
    }), 400);
  } else {
    record('final SUPER_ADMIN protection skipped', `${activeSuperAdmins} active SUPER_ADMIN accounts exist`);
  }

  await expectStatus('SUPER_ADMIN deletes another admin', api(`/admin/${adminId}`, {
    method: 'DELETE',
    token: superToken,
  }), 200);
  created.admins = created.admins.filter((id) => id !== adminId);
}

async function runPostTests(superToken) {
  await expectStatus('list posts', api('/posts?limit=2'), 200);

  const basePost = await expectStatus('create post without media', api('/posts', {
    method: 'POST',
    token: superToken,
    body: {
      title: `${runId} plain post`,
      description: 'Smoke post description',
      profileName: 'Radio Yeraz',
      eventDate: new Date(Date.now() + 86_400_000).toISOString(),
      eventTime: '12:30',
      location: 'Smoke Test',
      isPublished: false,
      isLive: false,
    },
  }), 201);
  const postId = basePost.data.data._id;
  created.posts.push(postId);

  await expectStatus('get one post', api(`/posts/${postId}`), 200);
  await expectStatus('post search', api(`/posts/search?q=${encodeURIComponent(runId)}&limit=5`), 200);
  await expectStatus('post pagination and filters', api('/posts?page=1&limit=1&isPublished=false'), 200);

  const mediaPost = await expectStatus('create post with image and video', api('/posts', {
    method: 'POST',
    token: superToken,
    form: postForm({
      title: `${runId} media post`,
      description: 'Smoke media post description',
      isPublished: 'true',
      isLive: 'true',
    }, true, true),
  }), 201);
  const mediaPostId = mediaPost.data.data._id;
  created.posts.push(mediaPostId);
  addUploadedFile(mediaPost.data.data.mainImage);
  addUploadedFile(mediaPost.data.data.video);
  assert(mediaPost.data.data.mainImage.startsWith('/uploads/posts/images/'), 'post image path is not relative upload path');
  assert(mediaPost.data.data.video.startsWith('/uploads/posts/videos/'), 'post video path is not relative upload path');

  const updated = await expectStatus('edit post title and description and replace media', api(`/posts/${mediaPostId}`, {
    method: 'PUT',
    token: superToken,
    form: postForm({
      title: `${runId} media post edited`,
      description: 'Smoke media post edited description',
      isPublished: 'false',
      isLive: 'false',
    }, true, false),
  }), 200);
  addUploadedFile(updated.data.data.mainImage);

  await expectStatus('publish/unpublish through toggle-live', api(`/posts/${mediaPostId}/toggle-live`, {
    method: 'PUT',
    token: superToken,
  }), 200);
  await expectStatus('republish post', api(`/posts/${mediaPostId}/republish`, {
    method: 'PUT',
    token: superToken,
  }), 200);
  await expectStatus('invalid post ID rejected', api('/posts/not-valid-object-id'), 400);
  await expectStatus('missing style post ID rejected', api('/posts/undefined'), 400);

  await expectStatus('delete media post', api(`/posts/${mediaPostId}`, {
    method: 'DELETE',
    token: superToken,
  }), 200);
  created.posts = created.posts.filter((id) => id !== mediaPostId);
  await expectStatus('delete plain post', api(`/posts/${postId}`, {
    method: 'DELETE',
    token: superToken,
  }), 200);
  created.posts = created.posts.filter((id) => id !== postId);
}

async function runAdTests(superToken) {
  await expectStatus('list ads', api('/ads?limit=2'), 200);
  await expectStatus('list public ads', api('/ads/public?limit=2'), 200);

  const ad = await expectStatus('create ad with image', api('/ads', {
    method: 'POST',
    token: superToken,
    form: imageForm({
      name: `${runId} active ad`,
      targetUrl: 'https://example.com',
      startDate: new Date(Date.now() - 60_000).toISOString(),
      endDate: new Date(Date.now() + 86_400_000).toISOString(),
    }),
  }), 201);
  const adId = ad.data.data._id;
  created.ads.push(adId);
  addUploadedFile(ad.data.data.image);
  assert(ad.data.data.image.startsWith('/uploads/ads/'), 'ad image path is not relative upload path');
  assert(ad.data.data.status === 'active', 'active ad status was not calculated correctly');

  await expectStatus('get one ad', api(`/ads/${adId}`), 200);
  await expectStatus('ad pagination and filtering', api('/ads?page=1&limit=1&status=active'), 200);
  await expectStatus('edit ad', api(`/ads/${adId}`, {
    method: 'PUT',
    token: superToken,
    body: { name: `${runId} active ad edited`, targetUrl: 'https://example.org' },
  }), 200);
  await expectStatus('deactivate ad', api(`/ads/${adId}/toggle-active`, {
    method: 'PUT',
    token: superToken,
  }), 200);
  await expectStatus('activate ad', api(`/ads/${adId}/toggle-active`, {
    method: 'PUT',
    token: superToken,
  }), 200);

  const pendingAd = await expectStatus('future start date creates pending ad', api('/ads', {
    method: 'POST',
    token: superToken,
    form: imageForm({
      name: `${runId} pending ad`,
      startDate: new Date(Date.now() + 86_400_000).toISOString(),
    }),
  }), 201);
  created.ads.push(pendingAd.data.data._id);
  addUploadedFile(pendingAd.data.data.image);
  assert(pendingAd.data.data.status === 'pending', 'pending ad status was not calculated correctly');

  const expiredAd = await expectStatus('past end date creates expired ad', api('/ads', {
    method: 'POST',
    token: superToken,
    form: imageForm({
      name: `${runId} expired ad`,
      startDate: new Date(Date.now() - 172_800_000).toISOString(),
      endDate: new Date(Date.now() - 86_400_000).toISOString(),
    }),
  }), 201);
  created.ads.push(expiredAd.data.data._id);
  addUploadedFile(expiredAd.data.data.image);
  assert(expiredAd.data.data.status === 'expired', 'expired ad status was not calculated correctly');

  await expectStatus('invalid ad ID returns not found', api('/ads/not-valid-id'), 404);
  for (const id of [...created.ads]) {
    await expectStatus(`delete ad ${id}`, api(`/ads/${id}`, {
      method: 'DELETE',
      token: superToken,
    }), 200);
    created.ads = created.ads.filter((adIdValue) => adIdValue !== id);
  }
}

async function runStreamLinkTests(superToken) {
  await expectStatus('list stream links', api('/stream-links'), 200);
  await expectStatus('list active stream links', api('/stream-links/active'), 200);
  await expectStatus('stream link create requires auth', api('/stream-links', {
    method: 'POST',
    body: { title: `${runId} blocked`, url: 'https://example.com' },
  }), 401);
  await expectStatus('invalid stream URL rejected', api('/stream-links', {
    method: 'POST',
    token: superToken,
    body: { title: `${runId} invalid`, url: 'not-a-url' },
  }), 400);
  const stream = await expectStatus('create stream link', api('/stream-links', {
    method: 'POST',
    token: superToken,
    body: {
      title: `${runId} stream`,
      url: 'https://example.com/stream',
      description: 'Smoke stream',
      isActive: true,
    },
  }), 201);
  const streamId = stream.data._id || stream.data.id;
  created.streamLinks.push(streamId);
  await expectStatus('get stream link', api(`/stream-links/${streamId}`), 200);
  await expectStatus('edit and deactivate stream link', api(`/stream-links/${streamId}`, {
    method: 'PATCH',
    token: superToken,
    body: { isActive: false, title: `${runId} stream edited` },
  }), 200);
  await expectStatus('reactivate stream link', api(`/stream-links/${streamId}`, {
    method: 'PATCH',
    token: superToken,
    body: { isActive: true },
  }), 200);
  await expectStatus('delete stream link', api(`/stream-links/${streamId}`, {
    method: 'DELETE',
    token: superToken,
  }), 200);
  created.streamLinks = created.streamLinks.filter((id) => id !== streamId);
}

async function runNotificationTests(superToken) {
  await expectStatus('notification list requires authentication', api('/notifications'), 401);
  const list = await expectStatus('notification list with authentication', api('/notifications?limit=5', {
    token: superToken,
  }), 200);
  assert(Array.isArray(list.data.data), 'notification list did not return an array');

  const notification = await prisma.notification.create({
    data: {
      id: objectId(),
      title: `${runId} notification`,
      message: `${runId} notification message`,
      type: 'ADMIN_UPDATED',
      authorName: runId,
    },
  });
  await expectStatus('mark one notification read', api(`/notifications/${notification.id}/read`, {
    method: 'PUT',
    token: superToken,
  }), 200);
  const readBack = await prisma.notification.findUnique({ where: { id: notification.id } });
  assert(readBack?.isRead === true, 'notification was not marked read');
  await expectStatus('mark all notifications read', api('/notifications/mark-all-read', {
    method: 'PUT',
    token: superToken,
  }), 200);
  await expectStatus('delete one notification', api(`/notifications/${notification.id}`, {
    method: 'DELETE',
    token: superToken,
  }), 200);
  record('private per-user notification ownership', 'not applicable: notifications are global in current schema');

  try {
    const { io } = require('../../frontend/node_modules/socket.io-client');
    await new Promise((resolve, reject) => {
      const socket = io(API_BASE_URL.replace(/\/api$/, ''), {
        transports: ['websocket', 'polling'],
        timeout: 3000,
      });
      const timer = setTimeout(() => {
        socket.disconnect();
        reject(new Error('anonymous Socket.IO connection was not rejected'));
      }, 4000);
      socket.on('auth_error', () => {
        clearTimeout(timer);
        socket.disconnect();
        resolve();
      });
      socket.on('connect_error', () => {
        clearTimeout(timer);
        socket.disconnect();
        resolve();
      });
    });
    record('Socket.IO rejects anonymous clients');

    await new Promise((resolve, reject) => {
      const socket = io(API_BASE_URL.replace(/\/api$/, ''), {
        transports: ['websocket', 'polling'],
        timeout: 3000,
        auth: { token: superToken },
      });
      const timer = setTimeout(() => {
        socket.disconnect();
        reject(new Error('authenticated Socket.IO connection timed out'));
      }, 4000);
      socket.on('connect', () => {
        clearTimeout(timer);
        socket.disconnect();
        resolve();
      });
      socket.on('connect_error', (error) => {
        clearTimeout(timer);
        socket.disconnect();
        reject(error);
      });
    });
    record('Socket.IO connects with authenticated admin token');
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND') {
      record('Socket.IO smoke skipped', error.message);
      return;
    }
    throw error;
  }
}

async function runDashboardChecks() {
  const root = await fetch(`${APP_BASE_URL}/`);
  assert(root.status === 200, `frontend root returned ${root.status}`);
  const loginPage = await fetch(`${APP_BASE_URL}/login`);
  assert(loginPage.status === 200, `login page returned ${loginPage.status}`);
  const dashboard = await fetch(`${APP_BASE_URL}/dashboard`);
  assert(dashboard.status === 200, `dashboard shell returned ${dashboard.status}`);
  record('frontend root/login/dashboard respond');
}

async function runRouteOrderChecks(superToken) {
  await expectStatus('route order: admin statistics not treated as ID', api('/admin/statistics/summary', {
    token: superToken,
  }), 200);
  await expectStatus('route order: stream active not treated as ID', api('/stream-links/active'), 200);
  await expectStatus('route order: notifications mark-all-read not treated as ID', api('/notifications/mark-all-read', {
    method: 'PUT',
    token: superToken,
  }), 200);
  await expectStatus('route order: posts statistics summary reachable', api('/posts/statistics/summary'), [200, 401, 403]);
}

async function runSeedChecks(seedUsername, seedPassword) {
  const activeSuperAdmins = await prisma.admin.count({
    where: { role: AdminRole.SUPER_ADMIN, isActive: true },
  });
  assert(activeSuperAdmins >= 1, 'no active SUPER_ADMIN exists');
  const seedAdmin = await prisma.admin.findUnique({ where: { username: seedUsername } });
  assert(seedAdmin?.role === AdminRole.SUPER_ADMIN && seedAdmin?.isActive, 'seed admin is not an active SUPER_ADMIN');
  await login(seedUsername, seedPassword, 200);
  record('seeded SUPER_ADMIN exists and can log in');
}

async function main() {
  const seedUsername = requiredEnv('SEED_ADMIN_USERNAME');
  const seedPassword = requiredEnv('SEED_ADMIN_PASSWORD');

  await cleanup();
  const auth = await runAuthTests(seedUsername, seedPassword);
  await runAdminPermissionTests(auth.accessToken, auth.adminId);
  await runPostTests(auth.accessToken);
  await runAdTests(auth.accessToken);
  await runStreamLinkTests(auth.accessToken);
  await runNotificationTests(auth.accessToken);
  await runDashboardChecks();
  await runRouteOrderChecks(auth.accessToken);
  await runSeedChecks(seedUsername, seedPassword);

  console.log(`SMOKE TESTS PASSED (${results.length} checks)`);
}

main()
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup().catch(() => undefined);
    await prisma.$disconnect();
  });
