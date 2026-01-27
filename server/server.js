import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import apiLimiter from './middleware/rateLimiter.js';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import { sequelize } from './config/database.js';
import adminRoutes from './routes/adminRoutes.js';

// استيراد المودلز
import User from './models/User.js';
import Post from './models/Post.js';
import Like from './models/Like.js';
import UserLike from './models/UserLike.js';
import Comment from './models/Comment.js';
import Attachment from './models/Attachment.js';
import Notification from './models/Notification.js';
import Community from './models/Community.js';
import CommunityMember from './models/CommunityMember.js';
import CommunityMessage from './models/CommunityMessage.js';
import Follow from './models/Follow.js';
import Audit from './models/Audit.js';
import PrivateChat from './models/PrivateChat.js';
import PrivateMessage from './models/PrivateMessage.js';
import SubscriptionPlan from './models/SubscriptionPlan.js';
import UserSubscription from './models/UserSubscription.js';
import AIConversation from './models/AIConversation.js';
import AIMessage from './models/AIMessage.js';
import Announcement from './models/Announcement.js';
import Rating from './models/Rating.js';

// استيراد الراوتس
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import privateChatRoutes from './routes/privateChatRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';

dotenv.config();

const app = express();

// ✅✅✅ هذا هو السطر السحري المفقود الذي يحل المشكلة في Render
app.set('trust proxy', 1); 

const server = http.createServer(app);

// ✅ إعداد Socket.io
const io = new Server(server, {
    cors: {
        origin: [
            "https://najah-hub.vercel.app", 
            "http://localhost:5173", 
            "http://localhost:5174", 
            "http://localhost:3000"
        ],
        methods: ["GET", "POST"]
    }
});

app.set('io', io);
app.set('dbAvailable', false);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ إعداد CORS
app.use(cors({
    origin: [
        "https://najah-hub.vercel.app", 
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(helmet());

// ✅ الآن لن يحدث الخطأ لأننا أضفنا trust proxy في الأعلى
app.use('/api', apiLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// تعريف العلاقات (نفس الكود السابق)
User.hasMany(Post, { foreignKey: 'userId', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Like, { foreignKey: 'userId', onDelete: 'CASCADE' });
Like.belongsTo(User, { foreignKey: 'userId' });

Post.hasMany(Like, { foreignKey: 'postId', onDelete: 'CASCADE' });
Like.belongsTo(Post, { foreignKey: 'postId' });

User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId' });

Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

Post.hasMany(Attachment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Attachment.belongsTo(Post, { foreignKey: 'postId' });

Community.belongsTo(User, { foreignKey: 'creatorId' });
User.hasMany(Community, { foreignKey: 'creatorId' });
Community.hasMany(CommunityMember, { foreignKey: 'communityId', onDelete: 'CASCADE' });
CommunityMember.belongsTo(Community, { foreignKey: 'communityId' });
User.hasMany(CommunityMember, { foreignKey: 'userId', onDelete: 'CASCADE' });
CommunityMember.belongsTo(User, { foreignKey: 'userId' });

Notification.belongsTo(User, { as: 'Receiver', foreignKey: 'receiverId' });
Notification.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
User.hasMany(Notification, { foreignKey: 'receiverId', onDelete: 'CASCADE' });

User.hasMany(UserLike, { foreignKey: 'likedUserId', as: 'ProfileLikes', onDelete: 'CASCADE' });
UserLike.belongsTo(User, { foreignKey: 'likedUserId', as: 'LikedUser' });
UserLike.belongsTo(User, { foreignKey: 'likerId', as: 'Liker' });
User.hasMany(UserLike, { foreignKey: 'likerId', as: 'GivenLikes', onDelete: 'CASCADE' });

Follow.belongsTo(User, { as: 'Follower', foreignKey: 'followerId' });
Follow.belongsTo(User, { as: 'Following', foreignKey: 'followingId' });
User.hasMany(Follow, { foreignKey: 'followerId', as: 'FollowingItems' });
User.hasMany(Follow, { foreignKey: 'followingId', as: 'FollowerItems' });

User.hasMany(CommunityMessage, { foreignKey: 'userId', onDelete: 'CASCADE' });
CommunityMessage.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Rating, { foreignKey: 'userId', onDelete: 'CASCADE' });
Rating.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(AIConversation, { foreignKey: 'userId', onDelete: 'CASCADE' });
AIConversation.belongsTo(User, { foreignKey: 'userId' });
AIConversation.hasMany(AIMessage, { foreignKey: 'conversationId', onDelete: 'CASCADE' });
AIMessage.belongsTo(AIConversation, { foreignKey: 'conversationId' });

User.hasMany(UserSubscription, { foreignKey: 'userId', onDelete: 'CASCADE' });
UserSubscription.belongsTo(User, { foreignKey: 'userId' });

SubscriptionPlan.hasMany(UserSubscription, { foreignKey: 'planId', onDelete: 'CASCADE' });
UserSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'Plan' });

// الراوتس
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', (await import('./routes/announcementRoutes.js')).default);
app.use('/api/communities', communityRoutes);
app.use('/api/private', privateChatRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/ratings', (await import('./routes/ratingRoutes.js')).default);


// Socket.io Logic
let onlineUsers = [];
io.on("connection", (socket) => {
    socket.on("newUser", (user) => {
        const userId = user?.userId ?? user;
        const name = user?.name || null;
        const avatar = user?.avatar || null;
        if (!onlineUsers.some(u => u.socketId === socket.id)) {
            onlineUsers.push({ userId, socketId: socket.id, name, avatar });
        } else {
            onlineUsers = onlineUsers.map(u => u.socketId === socket.id ? { ...u, userId, name, avatar } : u);
        }
        const seen = new Set();
        const uniq = [];
        for (const u of onlineUsers) {
            if (!seen.has(u.userId)) {
                seen.add(u.userId);
                uniq.push({ userId: u.userId, name: u.name, avatar: u.avatar });
            }
        }
        io.emit('onlineUsers', uniq);
    });

    socket.on("sendNotification", ({ senderName, receiverId, type }) => {
        const receiver = onlineUsers.find(user => user.userId === receiverId);
        if (receiver) {
            io.to(receiver.socketId).emit("getNotification", { senderName, type });
        }
    });

    socket.on("disconnect", () => {
        onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id);
        const seen = new Set();
        const uniq = [];
        for (const u of onlineUsers) {
            if (!seen.has(u.userId)) {
                seen.add(u.userId);
                uniq.push({ userId: u.userId, name: u.name, avatar: u.avatar });
            }
        }
        io.emit('onlineUsers', uniq);
    });
});

const privateSockets = {};
io.on('connection', (socket) => {
    socket.on('registerUser', ({ userId }) => {
        if (!userId) return;
        if (!privateSockets[userId]) privateSockets[userId] = new Set();
        privateSockets[userId].add(socket.id);
    });
    socket.on('unregisterUser', ({ userId }) => {
        if (!userId) return;
        privateSockets[userId]?.delete(socket.id);
    });
    socket.on('privateMessage', async (payload) => {
        try {
            const { chatId, senderId, receiverId, text, attachments, clientTempId } = payload || {};
            const msg = await PrivateMessage.create({ chatId, senderId, receiverId, text: text || '', attachments: Array.isArray(attachments) ? attachments : null });
            const out = { id: msg.id, chatId, senderId, receiverId, text: msg.text, attachments: msg.attachments, createdAt: msg.createdAt, clientTempId: clientTempId || null };
            const sendToSet = new Set();
            if (privateSockets[senderId]) for (const sid of privateSockets[senderId]) sendToSet.add(sid);
            if (privateSockets[receiverId]) for (const sid of privateSockets[receiverId]) sendToSet.add(sid);
            for (const sid of sendToSet) io.to(sid).emit('privateMessage', out);
        } catch (err) { console.error('Failed to save/send private message', err); }
    });
    socket.on('disconnect', () => {
        for (const [uid, set] of Object.entries(privateSockets)) {
            if (set.has(socket.id)) set.delete(socket.id);
        }
    });
});

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ communityId, userId }) => {
        const room = `community-${communityId}`;
        socket.join(room);
    });
    socket.on('leaveRoom', ({ communityId, userId }) => {
        const room = `community-${communityId}`;
        socket.leave(room);
    });
    socket.on('sendMessage', async (payload) => {
        try {
            const { communityId, userId, text, name, attachments, clientTempId } = payload || {};
            const msg = await CommunityMessage.create({ communityId, userId, text: text || '', attachments: Array.isArray(attachments) ? attachments : null });
            const out = { id: msg.id, communityId, userId, text: msg.text, attachments: msg.attachments, name, createdAt: msg.createdAt, clientTempId: clientTempId || null };
            io.to(`community-${communityId}`).emit('communityMessage', out);
        } catch (err) { console.error('Failed to save/send community message', err); }
    });
    socket.on('typing', ({ communityId, userId, name }) => {
        const room = `community-${communityId}`;
        socket.to(room).emit('typing', { userId, name });
    });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

const startServer = async () => {
    try {
        if (!process.env.DATABASE_URL && (!process.env.DB_NAME || !process.env.DB_USER)) {
            console.warn('⚠️ Database credentials missing. Skipping DB connect.');
        } else {
            await sequelize.authenticate();
            console.log('✅ Database connected.');
            await sequelize.sync({ alter: true });
            app.set('dbAvailable', true);
        }
        server.on('error', (err) => {
            if (err && err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use.`);
            } else {
                console.error('❌ Server error:', err);
            }
            process.exit(1);
        });
        server.listen(PORT, () => console.log(`🚀 Server + Socket.io running on port ${PORT}`));
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

startServer();