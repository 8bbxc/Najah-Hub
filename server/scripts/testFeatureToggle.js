import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API = process.env.API_URL || 'http://localhost:5000';

const login = async () => {
  const res = await axios.post(`${API}/api/auth/login`, { universityId: '0000', password: 'Yazan@2006.com#DB***' });
  return res.data.token;
};

const run = async () => {
  try {
    const token = await login();
    console.log('Got token length', token?.length);
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const usersRes = await axios.get(`${API}/api/admin/users`, config);
    const users = usersRes.data || [];
    const target = users.find(u => String(u.universityId) !== '0000');
    if (!target) return console.error('No target user found to toggle');

    console.log('Toggling feature for user', target.id || target._id, 'current isFeatured=', target.isFeatured);
    const putRes = await axios.put(`${API}/api/admin/users/${target.id || target._id}/feature`, { featured: !target.isFeatured }, config);
    console.log('PUT response:', putRes.data);
  } catch (err) {
    if (err.response) console.error('Error status', err.response.status, err.response.data);
    else console.error('Error', err.message || err);
  }
};

run();
