import dotenv from 'dotenv';
import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import CommunityMember from '../models/CommunityMember.js';
import { Op } from 'sequelize';

dotenv.config();

const ADMIN_UNI = process.env.ADMIN_UNI || null; // e.g. '0000' or the admin's universityId
const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : null; // or user id

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected for assignAdmin script');

    // find target admin user
    let adminUser = null;
    if (ADMIN_UNI) {
      adminUser = await User.findOne({ where: { universityId: ADMIN_UNI } });
    } else if (ADMIN_ID) {
      adminUser = await User.findByPk(ADMIN_ID);
    }

    if (!adminUser) {
      console.error('Admin user not found. Provide ADMIN_UNI or ADMIN_ID as env variable.');
      process.exit(1);
    }

    console.log('Target admin user:', { id: adminUser.id, universityId: adminUser.universityId, role: adminUser.role });

    // gather all batches from users
    const users = await User.findAll({ attributes: ['batch', 'id'], where: { batch: { [Op.ne]: null } } });
    const batches = Array.from(new Set(users.map(u => u.batch).filter(b => b && Number(b) > 0))).sort((a,b)=>a-b);

    // create missing communities for each batch
    for (const batch of batches) {
      let community = await Community.findOne({ where: { batch } });
      if (!community) {
        const name = `دفعة ${batch}`;
        let slug = `batch-${batch}`;
        let i = 1;
        while (await Community.findOne({ where: { slug } })) {
          slug = `batch-${batch}-${i++}`;
        }
        community = await Community.create({ name, slug, description: `مجتمع الطلاب للدفعة ${batch}`, privacy: 'private', batch, creatorId: adminUser.id });
        console.log(`Created community ${name} (id: ${community.id})`);
      } else {
        console.log(`Existing community for batch ${batch} (id: ${community.id})`);
      }
    }

    // ensure admin user is a member/admin of all communities
    const allCommunities = await Community.findAll();
    for (const comm of allCommunities) {
      const [member, created] = await CommunityMember.findOrCreate({ where: { communityId: comm.id, userId: adminUser.id }, defaults: { role: 'admin' } });
      if (!created) {
        // update role if not admin
        if (member.role !== 'admin') {
          member.role = 'admin';
          await member.save();
          console.log(`Updated user ${adminUser.id} to admin in community ${comm.id}`);
        } else {
          console.log(`User ${adminUser.id} already admin in community ${comm.id}`);
        }
      } else {
        console.log(`Added user ${adminUser.id} as admin to community ${comm.id}`);
      }
    }

    console.log('Assign admin to all communities completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error in assignAdmin script', err);
    process.exit(1);
  }
};

run();
