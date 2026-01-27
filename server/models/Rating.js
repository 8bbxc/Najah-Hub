import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Rating = sequelize.define('Rating', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    comment: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: 'Ratings'
});

export default Rating;