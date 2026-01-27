import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileType: { // ✅✅ تأكد من وجود هذا العمود!
    type: DataTypes.STRING, 
    allowNull: true, 
  },
  // ... باقي الأعمدة مثل postId
});

export default Attachment;