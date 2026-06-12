import mongoose from 'mongoose';
const bcrypt = require('bcryptjs');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const hash = await bcrypt.hash('superadmin123', 10);
  await mongoose.connection.db.collection('admins').insertOne({
    username: 'superadmin',
    password: hash,
    role: 'SUPER_ADMIN',
    isActive: true,
    displayName: 'Super Admin',
    createdAt: new Date()
  });
  console.log('Admin created!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });