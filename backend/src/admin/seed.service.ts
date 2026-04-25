// src/admin/seed.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, Role } from './schemas/admin.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(@InjectModel(Admin.name) private adminModel: Model<Admin>) {}

  async onModuleInit() {
    await this.seedSuperAdmin();
  }

  async seedSuperAdmin() {
    const superAdminExists = await this.adminModel.findOne({
      username: 'superadmin',
      role: Role.SUPER_ADMIN,
    });

    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);

      const superAdmin = new this.adminModel({
        username: 'superadmin',
        password: hashedPassword,
        displayName: 'Super Administrator',
        role: Role.SUPER_ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await superAdmin.save();
      console.log('✅ Super admin created successfully');
    } else {
      console.log('ℹ️  Super admin already exists');
    }
  }
}
