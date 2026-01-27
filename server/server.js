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
const server = http.createServer(app);

// ✅ 1. إعداد Socket.io مع السماح لرابط Vercel
const io = new Server(server, {
    cors: {
        origin: [
            "https://najah-hub.vercel.app", // 👈 رابط موقعك الرسمي
            "http://localhost:5173", 
            "http://localhost:5174", 
            "http://localhost:3000"
        ],
        methods: ["GET", "POST"]
    }
});

// expose io to controllers via app locals
app.set('io', io);
// track DB availability for controllers
app.set('dbAvailable', false);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 2. إعداد Express CORS مع السماح لرابط Vercel والكوكيز
app.use(cors({
    origin: [
        "https://najah-hub.vercel.app", // 👈 رابط موقعك الرسمي
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:3000"
    ],
    credentials: true, // مهم جداً للسماح بتمرير التوكن والكوكيز
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// Basic security headers
app.use(helmet());

// Apply rate limiter to all API routes
app.use('/api', apiLimiter);

// Increase payload limits to support large base64 image uploads from the client
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// تعريف العلاقات (Associations)
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

// مجتمعات
Community.belongsTo(User, { foreignKey: 'creatorId' });
User.hasMany(Community, { foreignKey: 'creatorId' });
Community.hasMany(CommunityMember, { foreignKey: 'communityId', onDelete: 'CASCADE' });
CommunityMember.belongsTo(Community, { foreignKey: 'communityId' });
User.hasMany(CommunityMember, { foreignKey: 'userId', onDelete: 'CASCADE' });
CommunityMember.belongsTo(User, { foreignKey: 'userId' });

Notification.belongsTo(User, { as: 'Receiver', foreignKey: 'receiverId' });
Notification.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
User.hasMany(Notification, { foreignKey: 'receiverId', onDelete: 'CASCADE' });

// profile likes (liker -> likedUser)
User.hasMany(UserLike, { foreignKey: 'likedUserId', as: 'ProfileLikes', onDelete: 'CASCADE' });
UserLike.belongsTo(User, { foreignKey: 'likedUserId', as: 'LikedUser' });
UserLike.belongsTo(User, { foreignKey: 'likerId', as: 'Liker' });
User.hasMany(UserLike, { foreignKey: 'likerId', as: 'GivenLikes', onDelete: 'CASCADE' });

// Follows associations
Follow.belongsTo(User, { as: 'Follower', foreignKey: 'followerId' });
Follow.belongsTo(User, { as: 'Following', foreignKey: 'followingId' });
User.hasMany(Follow, { foreignKey: 'followerId', as: 'FollowingItems' });
User.hasMany(Follow, { foreignKey: 'followingId', as: 'FollowerItems' });

// Community messages association so we can include sender info when querying
User.hasMany(CommunityMessage, { foreignKey: 'userId', onDelete: 'CASCADE' });
CommunityMessage.belongsTo(User, { foreignKey: 'userId' });

// Ratings association
User.hasMany(Rating, { foreignKey: 'userId', onDelete: 'CASCADE' });
Rating.belongsTo(User, { foreignKey: 'userId' });

// AI conversation/message associations
User.hasMany(AIConversation, { foreignKey: 'userId', onDelete: 'CASCADE' });
AIConversation.belongsTo(User, { foreignKey: 'userId' });
AIConversation.hasMany(AIMessage, { foreignKey: 'conversationId', onDelete: 'CASCADE' });
AIMessage.belongsTo(AIConversation, { foreignKey: 'conversationId' });

// Subscriptions associations
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


// ✅ منطق Socket.io لإدارة التنبيهات اللحظية
let onlineUsers = [];
io.on("connection", (socket) => {
    // عند تسجيل دخول مستخدم، نربط معرفه (UserId) ومعطياته بمعرف السوكت
    socket.on("newUser", (user) => {
        // support legacy emit of just id
        const userId = user?.userId ?? user;
        const name = user?.name || null;
        const avatar = user?.avatar || null;

        // add or update entry for this socket
        if (!onlineUsers.some(u => u.socketId === socket.id)) {
            onlineUsers.push({ userId, socketId: socket.id, name, avatar });
        } else {
            onlineUsers = onlineUsers.map(u => u.socketId === socket.id ? { ...u, userId, name, avatar } : u);
        }

        // announce updated online list (dedupe by userId so user shows once)
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

    // استقبال حدث إرسال التنبيه وتوجيهه للمستلم فوراً
    socket.on("sendNotification", ({ senderName, receiverId, type }) => {
        const receiver = onlineUsers.find(user => user.userId === receiverId);
        if (receiver) {
            io.to(receiver.socketId).emit("getNotification", {
                senderName,
                type,
            });
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

// Private messaging sockets: map userId to socketId(s)
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
            // persist
            const msg = await PrivateMessage.create({ chatId, senderId, receiverId, text: text || '', attachments: Array.isArray(attachments) ? attachments : null });
            const out = { id: msg.id, chatId, senderId, receiverId, text: msg.text, attachments: msg.attachments, createdAt: msg.createdAt, clientTempId: clientTempId || null };
            // emit to sender's sockets and receiver's sockets
            const sendToSet = new Set();
            if (privateSockets[senderId]) for (const sid of privateSockets[senderId]) sendToSet.add(sid);
            if (privateSockets[receiverId]) for (const sid of privateSockets[receiverId]) sendToSet.add(sid);
            for (const sid of sendToSet) io.to(sid).emit('privateMessage', out);
        } catch (err) { console.error('Failed to save/send private message', err); }
    });

    socket.on('disconnect', () => {
        // cleanup from privateSockets
        for (const [uid, set] of Object.entries(privateSockets)) {
            if (set.has(socket.id)) set.delete(socket.id);
        }
    });
});

// Chat: غرفة المجتمعات
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
        } catch (err) {
            console.error('Failed to save/send community message', err);
        }
    });

    // typing indicator within a community room
    socket.on('typing', ({ communityId, userId, name }) => {
        const room = `community-${communityId}`;
        socket.to(room).emit('typing', { userId, name });
    });
});

// Use PORT from environment if provided, otherwise default to 5000
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

const startServer = async () => {
    try {
        // If environment lacks DB credentials, skip DB connect to allow limited dev server
        // في ريندر نحن نستخدم DATABASE_URL لذا هذا الشرط يعمل بشكل صحيح
        if (!process.env.DATABASE_URL && (!process.env.DB_NAME || !process.env.DB_USER)) {
            console.warn('⚠️ Database credentials missing. Skipping DB connect.');
        } else {
            await sequelize.authenticate();
            console.log('✅ Database connected.');
            await sequelize.sync({ alter: true });
            app.set('dbAvailable', true);
        }
        
        // Attach a friendly error handler for server-level errors (EADDRINUSE etc.)
        server.on('error', (err) => {
            if (err && err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use. Stop the process using that port or change PORT.`);
            } else {
                console.error('❌ Server error:', err);
            }
            // exit with non-zero so process managers/nodemon know it failed
            process.exit(1);
        });

        // ✅ التشغيل باستخدام server.listen
        server.listen(PORT, () => console.log(`🚀 Server + Socket.io running on port ${PORT}`));
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

startServer();