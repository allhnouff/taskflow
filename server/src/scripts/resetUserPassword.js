import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';

dotenv.config();

const resetUserPassword = async () => {
  try {
    await connectDB();

    const email = process.argv[2] || 'user@taskflow.com';
    const newPassword = process.argv[3] || 'User123';

    console.log(`\nResetting password for: ${email}`);
    console.log(`New password: ${newPassword}\n`);

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    console.log(`✅ Password reset successfully for: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.active}\n`);

    // Verify the password works
    const testUser = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    const isValid = await testUser.matchPassword(newPassword);
    
    if (isValid) {
      console.log('✅ Password verification: SUCCESS\n');
    } else {
      console.log('❌ Password verification: FAILED\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
};

resetUserPassword();

