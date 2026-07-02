const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const helperPath = path.resolve(__dirname, '../dist/common/uploads/uploads-paths.js');

if (!fs.existsSync(helperPath)) {
  throw new Error('Build the backend before running this test: npm run build:server');
}

const uploads = require(helperPath);
const originalUploadsDir = process.env.UPLOADS_DIR;
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'radioyeraz-uploads-'));

function assertThrows(name, fn) {
  assert.throws(fn, /Unsafe|Unsupported/, name);
}

try {
  process.env.UPLOADS_DIR = tempRoot;

  assert.strictEqual(uploads.getUploadsRoot(), path.resolve(tempRoot));
  assert.strictEqual(
    uploads.getPostsImagesDirectory(),
    path.join(tempRoot, 'posts', 'images'),
  );

  uploads.ensureCommonUploadDirectories();
  assert(fs.existsSync(path.join(tempRoot, 'posts', 'images')));
  assert(fs.existsSync(path.join(tempRoot, 'carousels')));
  assert(fs.existsSync(path.join(tempRoot, 'images')));

  assert.strictEqual(
    uploads.normalizeStoredMediaPath('uploads/posts/images/file.jpg'),
    '/uploads/posts/images/file.jpg',
  );
  assert.strictEqual(
    uploads.normalizeStoredMediaPath('/uploads/posts/images/file.jpg'),
    '/uploads/posts/images/file.jpg',
  );
  assert.strictEqual(
    uploads.normalizeStoredMediaPath('/api/uploads/posts/images/file.jpg'),
    '/uploads/posts/images/file.jpg',
  );
  assert.strictEqual(
    uploads.normalizeStoredMediaPath('uploads\\posts\\images\\file.jpg'),
    '/uploads/posts/images/file.jpg',
  );
  assert.strictEqual(
    uploads.normalizeStoredMediaPath(
      'https://api.radioyeraz.com/uploads/posts/images/file.jpg',
    ),
    'https://api.radioyeraz.com/uploads/posts/images/file.jpg',
  );
  assert.strictEqual(
    uploads.normalizeStoredMediaPath(
      'https://api.radioyeraz.com/api/uploads/posts/images/file.jpg',
    ),
    'https://api.radioyeraz.com/uploads/posts/images/file.jpg',
  );
  assert.strictEqual(
    uploads.normalizeStoredMediaPath('https://cdn.example.com/image.jpg'),
    'https://cdn.example.com/image.jpg',
  );

  assertThrows('rejects unsafe protocols', () =>
    uploads.normalizeStoredMediaPath('javascript:alert(1)'),
  );
  assertThrows('rejects relative traversal', () =>
    uploads.normalizeStoredMediaPath('../../secret.txt'),
  );
  assertThrows('rejects nested traversal', () =>
    uploads.resolveUploadFilePath('/uploads/posts/../../secret.txt'),
  );

  const resolvedFile = uploads.resolveUploadFilePath(
    '/uploads/posts/images/static-serving-test.txt',
  );
  assert.strictEqual(
    resolvedFile,
    path.join(tempRoot, 'posts', 'images', 'static-serving-test.txt'),
  );

  fs.mkdirSync(path.dirname(resolvedFile), { recursive: true });
  fs.writeFileSync(resolvedFile, 'ok');
  assert.strictEqual(uploads.deleteUploadFileIfExists('/uploads/posts/images/static-serving-test.txt'), true);
  assert.strictEqual(uploads.deleteUploadFileIfExists('/uploads/posts/images/static-serving-test.txt'), false);

  console.log('uploads path tests passed');
} finally {
  if (originalUploadsDir === undefined) {
    delete process.env.UPLOADS_DIR;
  } else {
    process.env.UPLOADS_DIR = originalUploadsDir;
  }

  fs.rmSync(tempRoot, { recursive: true, force: true });
}
