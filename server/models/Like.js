import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Like = sequelize.define('Like', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }
    // ما بنحتاج أعمدة ثانية، لأنه السيكولايز رح يضيف userId و postId تلقائياً بالعلاقات
}, {
    timestamps: true
});

export default Like;