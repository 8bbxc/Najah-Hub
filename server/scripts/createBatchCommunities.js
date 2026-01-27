import dotenv from 'dotenv';
import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import CommunityMember from '../models/CommunityMember.js';
import { Op } from 'sequelize';

dotenv.config();

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected for seeding communities');

    // جلب جميع الدفعات الفريدة (غير صفرية وغير null)
    const users = await User.findAll({ attributes: ['batch', 'id', 'universityId', 'role'], where: { batch: { [Op.ne]: null } } });
    const batches = Array.from(new Set(users.map(u => u.batch).filter(b => b && Number(b) > 0))).sort((a,b)=>a-b);

    if (batches.length === 0) {
      console.log('No batches found to create communities for.');
      process.exit(0);
    }

    // اختيار منشئ افتراضي (المالك 0000 إن وجد)
    let owner = await User.findOne({ where: { universityId: '0000' } });
    if (!owner) {
      owner = await User.findOne({ where: { role: { [Op.in]: ['doctor','admin'] } } });
    }

    if (!owner) {
      console.log('No owner/admin/doctor found to assign as creator. Communities will be created with creatorId = 1 if exists.');
    }

    for (const batch of batches) {
      const existing = await Community.findOne({ where: { batch } });
      if (existing) {
        console.log(`Community for batch ${batch} already exists (id: ${existing.id})`);
        continue;
      }

      const name = `دفعة ${batch}`;
      let slug = `batch-${batch}`;
      // ضمان عدم تكرار السلاگ
      let i = 1;
      while (await Community.findOne({ where: { slug } })) {
        slug = `batch-${batch}-${i++}`;
      }

      const creatorId = owner ? owner.id : (users[0]?.id || 1);

      const community = await Community.create({ name, slug, description: `مجتمع الطلاب للدفعة ${batch}`, privacy: 'private', batch, creatorId });
      console.log(`Created community ${name} (id: ${community.id})`);

      // انضمام كل الطلاب من نفس الدفعة كمشاركين (اختياري كبير) — سنضيف فقط المنشئ كمشرف
      await CommunityMember.create({ userId: creatorId, communityId: community.id, role: 'admin' });
    }

    console.log('Batch communities seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error', err);
    process.exit(1);
  }
};

run();
