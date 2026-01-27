import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Setting = sequelize.define('Setting', {
    key: { type: DataTypes.STRING, allowNull: false, unique: true },
    value: { type: DataTypes.JSON, allowNull: true }
}, {
    timestamps: true
});

export default Setting;
