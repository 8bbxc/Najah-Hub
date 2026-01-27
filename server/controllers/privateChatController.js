import PrivateChat from '../models/PrivateChat.js';
import PrivateMessage from '../models/PrivateMessage.js';
import User from '../models/User.js';
import { Op } from 'sequelize';
import { cloudinary } from '../config/cloudinary.js';

export const getChatsForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await PrivateChat.findAll({ where: { [Op.or]: [{ userA: userId }, { userB: userId }] }, order: [['updatedAt','DESC']] });
    res.json(chats);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to fetch chats' }); }
};

export const getMessagesForChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await PrivateChat.findByPk(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (chat.userA !== req.user.id && chat.userB !== req.user.id) return res.status(403).json({ message: 'Not a member of this chat' });
    const msgs = await PrivateMessage.findAll({ where: { chatId }, order: [['createdAt','ASC']] });
    res.json(msgs);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to fetch messages' }); }
};

export const createOrGetChat = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ message: 'otherUserId required' });
    if (Number(otherUserId) === Number(req.user.id)) return res.status(400).json({ message: 'Cannot create chat with yourself' });
    const [chat, created] = await PrivateChat.findOrCreate({ where: { [Op.or]: [{ userA: req.user.id, userB: otherUserId }, { userA: otherUserId, userB: req.user.id }] }, defaults: { userA: req.user.id, userB: otherUserId } });
    res.json({ chat, created });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to create/get chat' }); }
};

export const uploadPrivateAttachments = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await PrivateChat.findByPk(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (chat.userA !== req.user.id && chat.userB !== req.user.id) return res.status(403).json({ message: 'Not a member of this chat' });

    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

    const uploadPromises = req.files.map(f => new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: 'najah_hub_private' }, (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      });
      uploadStream.end(f.buffer);
    }));

    const results = await Promise.all(uploadPromises);
    res.json({ attachments: results });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to upload attachments' }); }
};

export default { getChatsForUser, getMessagesForChat, createOrGetChat };
