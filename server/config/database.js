import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// إنشاء اتصال جديد
// Ensure credentials are strings to avoid driver errors (SASL expects string password)
const dbName = process.env.DB_NAME || '';
const dbUser = process.env.DB_USER || '';
const dbPassword = process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : '';

if (!dbName || !dbUser) {
    console.warn('Warning: DB_NAME or DB_USER is not set. Database connection may fail.');
}

const sequelize = new Sequelize(
    dbName,
    dbUser,
    dbPassword,
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false,
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ تم الاتصال بقاعدة بيانات Postgres بنجاح! (ES Modules)');
    } catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
    }
};

// تصدير باستخدام export الحديثة
export { sequelize, connectDB };