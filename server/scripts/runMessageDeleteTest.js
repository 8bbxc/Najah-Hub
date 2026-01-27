import axios from 'axios';
import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import CommunityMember from '../models/CommunityMember.js';
import CommunityMessage from '../models/CommunityMessage.js';
import generateToken from '../utils/generateToken.js';

const API = process.env.API_URL || 'http://localhost:5000';

const log = (...args) => console.log(new Date().toISOString(), ...args);

const run = async () => {
  await sequelize.authenticate();
  log('DB connected');

  // create author user with unique universityId
  const makeUni = (prefix) => `${prefix}${Date.now().toString().slice(-6)}`;
  const authorUni = makeUni('A');
  let adminUni = '0000';
  const existingOwner = await User.findOne({ where: { universityId: '0000' } });
  if (existingOwner) {
    adminUni = makeUni('S'); // choose a fallback unique id if system owner exists
  }

  const author = await User.create({ name: 'TestAuthor', universityId: authorUni, role: 'student', password: 'password123', gender: 'male' });
  const admin = await User.create({ name: 'TestAdmin', universityId: adminUni, role: 'admin', password: 'password123', gender: 'male' });

  const slugBase = 'test-community-' + Date.now().toString().slice(-5);
  const community = await Community.create({ name: 'Test Community', description: 'For testing', privacy: 'public', creatorId: admin.id, slug: slugBase });
  await CommunityMember.create({ communityId: community.id, userId: author.id, role: 'member' });
  await CommunityMember.create({ communityId: community.id, userId: admin.id, role: 'admin' });

  // create a message by author
  const msg = await CommunityMessage.create({ communityId: community.id, userId: author.id, text: 'This is a test message' });
  log('Created message', msg.id);

  const authorToken = generateToken(author.id);
  const adminToken = generateToken(admin.id);

  // Try deleting as author
  try {
    const res = await axios.delete(`${API}/api/communities/${community.id}/messages/${msg.id}`, { headers: { Authorization: `Bearer ${authorToken}` } });
    log('Author delete response:', res.data);
  } catch (err) {
    log('Author delete failed:', err.toString(), err.response?.status, err.response?.data);
  }

  // Recreate message
  const msg2 = await CommunityMessage.create({ communityId: community.id, userId: author.id, text: 'Message two' });
  log('Created message2', msg2.id);

  // Try deleting as admin
  try {
    const res = await axios.delete(`${API}/api/communities/${community.id}/messages/${msg2.id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    log('Admin delete response:', res.data);
  } catch (err) {
    log('Admin delete failed:', err.toString(), err.response?.status, err.response?.data);
  }

  log('Test complete');
  process.exit(0);
};

run().catch(e => { console.error('Test script error', e); process.exit(1); });
