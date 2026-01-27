import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize;

// التحقق: هل يوجد رابط قاعدة بيانات جاهز (نحن على Render)؟
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // هذا السطر هو الحل السحري لمشاكل Render
            }
        }
    });
} else {
    // الحالة الثانية: نحن على الجهاز الشخصي (Localhost)
    const dbName = process.env.DB_NAME || '';
    const dbUser = process.env.DB_USER || '';
    const dbPassword = process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : '';
    
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false,
    });
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ تم الاتصال بقاعدة بيانات Postgres بنجاح!');
    } catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
    }
};

export { sequelize, connectDB };