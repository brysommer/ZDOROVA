import { Model, DataTypes } from "sequelize";
import { sequelize } from './sequelize.js';


class zrNames extends Model {}
zrNames.init({
    drug_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    drug_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    drug_producer: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false
    }
}, {
    freezeTableName: false,
    timestamps: true,
    modelName: 'zrNames',
    sequelize
});

const createNewName = async (drugData) => {
    let res;
    try {
        res = await zrNames.create({ ...drugData });
        res = res.dataValues;
    } catch (err) {
        console.error(`Impossible to create drug: ${err}`);
    }
    return res;
};

const findAllNames = async () => {
    const res = await zrNames.findAll({ where: {  } });
    if (res.length > 0) return res.map(el => el.dataValues);
    return;
};

const findZrNameById = async (id) => {
    const res = await zrNames.findOne({ where: { id }});
    if (res) return res.dataValues;
    return;
}

export {
    zrNames,
    createNewName,
    findAllNames,
    findZrNameById
};   