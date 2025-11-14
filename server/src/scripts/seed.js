import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Setting from '../models/Setting.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@taskflow.com' });
    
    if (!adminExists) {
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@taskflow.com',
        password: 'Admin123',
        role: 'admin',
      });
      console.log('✅ Admin user created:', admin.email);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create manager user
    const managerExists = await User.findOne({ email: 'manager@taskflow.com' });
    
    if (!managerExists) {
      const manager = await User.create({
        name: 'Manager User',
        email: 'manager@taskflow.com',
        password: 'Manager123',
        role: 'manager',
      });
      console.log('✅ Manager user created:', manager.email);
    } else {
      console.log('ℹ️  Manager user already exists');
    }

    // Create regular user
    const userExists = await User.findOne({ email: 'user@taskflow.com' });
    
    if (!userExists) {
      const user = await User.create({
        name: 'Test User',
        email: 'user@taskflow.com',
        password: 'User123',
        role: 'user',
      });
      console.log('✅ User created:', user.email);
    } else {
      console.log('ℹ️  User already exists');
    }

    // Create default settings
    const defaultSettings = [
      { key: 'reminder_before_hours', value: 24, description: 'Hours before deadline to send reminder' },
    ];

    for (const setting of defaultSettings) {
      await Setting.findOneAndUpdate(
        { key: setting.key },
        setting,
        { upsert: true, new: true }
      );
    }

    console.log('✅ Default settings created');

    console.log('\n✅ Seeding completed!');
    console.log('\nDefault credentials:');
    console.log('Admin: admin@taskflow.com / Admin123');
    console.log('Manager: manager@taskflow.com / Manager123');
    console.log('User: user@taskflow.com / User123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedAdmin();

