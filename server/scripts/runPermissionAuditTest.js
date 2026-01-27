import dotenv from 'dotenv';
import axios from 'axios';
import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import CommunityMessage from '../models/CommunityMessage.js';

dotenv.config();

// This script seeds a few records to manually exercise delete scenarios.
// It does NOT attempt to call HTTP endpoints (tokens/flow differs per setup).
// After running, you can inspect DB tables (users, communities, communityMessages, audits).

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected for permission audit test');

    // create owner if missing
    let owner = await User.findOne({ where: { universityId: '0000' } });
    if (!owner) {
      owner = await User.create({ name: 'Owner', universityId: '0000', password: 'ownerpass', role: 'admin', status: 'active', gender: 'male' });
      console.log('Created owner', owner.id);
    }

    // create admin
    let admin = await User.findOne({ where: { universityId: '1111' } });
    if (!admin) {
      admin = await User.create({ name: 'Admin', universityId: '1111', password: 'adminpass', role: 'admin', status: 'active', gender: 'male' });
      console.log('Created admin', admin.id);
    }

    // create student author
    let student = await User.create({ name: 'Student', universityId: `2000${Date.now()%1000}`, password: 'student', role: 'student', status: 'active', gender: 'male' });
    console.log('Created student', student.id);

    // create community
    const community = await Community.create({ name: 'Test Community', slug: `test-${Date.now()}`, creatorId: owner.id });
    console.log('Created community', community.id);

    // create message by student
    const msg = await CommunityMessage.create({ communityId: community.id, userId: student.id, text: 'Test message for deletion' });
    console.log('Created message', msg.id);

    console.log('Seed complete. Use admin/owner/student accounts to test deletion via API or inspect audits.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
