import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    universityId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [4, 20] 
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'student',
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    batch: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // ✅ الحقول الجديدة
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
    },
    gender: {
        type: DataTypes.ENUM('male', 'female'),
        allowNull: false,
        validate: {
            isIn: [['male','female']]
        }
    }
    ,
    // معلومات اتصال اختيارية
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    whatsapp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // صلاحيات قابلة للتخصيص لأي رتبة (JSON)
    permissions: {
        type: DataTypes.JSON,
        allowNull: true
    }
    ,
    status: {
        type: DataTypes.ENUM('pending','active','disabled'),
        defaultValue: 'active'
    }
    ,
    isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isPremium: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    premiumExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
            // قواعد الدفعة: الطلاب لديهم رقم بطول 8، والدفعة هي أول 3 أرقام.
            if (user.universityId === '0000' || user.role === 'doctor' || user.role === 'admin' || user.universityId?.length === 4) {
                user.batch = 0;
            } else if (user.universityId && user.universityId.length === 8) {
                user.batch = parseInt(user.universityId.substring(0, 3));
            } else {
                user.batch = 0;
            }
        }
    }
});

User.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default User;