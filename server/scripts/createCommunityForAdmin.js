import dotenv from 'dotenv';
import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import CommunityMember from '../models/CommunityMember.js';

dotenv.config();

const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : 3;
const NAME = process.env.COMMUNITY_NAME || 'مجتمع الأدمن الرسمي';

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected for community creation');
    const user = await User.findByPk(ADMIN_ID);
    if (!user) { console.error('Admin user not found'); process.exit(1); }

    // create if not exists
    let community = await Community.findOne({ where: { creatorId: user.id, name: NAME } });
    if (!community) {
      let slug = NAME.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let i = 1;
      while (await Community.findOne({ where: { slug } })) {
        slug = `${slug}-${i++}`;
      }
      community = await Community.create({ name: NAME, slug, description: 'هذا مجتمع اختباري للأدمن', privacy: 'private', creatorId: user.id });
      console.log('Created community', community.id);
      await CommunityMember.create({ userId: user.id, communityId: community.id, role: 'admin' });
      console.log('Assigned admin membership');
    } else {
      console.log('Community already exists:', community.id);
      const [m, created] = await CommunityMember.findOrCreate({ where: { userId: user.id, communityId: community.id }, defaults: { role: 'admin' } });
      if (created) console.log('Assigned admin membership'); else if (m.role !== 'admin') { m.role = 'admin'; await m.save(); console.log('Updated role to admin'); }
    }

    process.exit(0);
  } catch (err) {
    console.error(err); process.exit(1);
  }
};

run();
