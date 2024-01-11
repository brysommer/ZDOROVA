import { Model, DataTypes } from "sequelize";
import { sequelize } from './sequelize.js';


class zrPrices extends Model {}
zrPrices.init({
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
    },
    pharmacy_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    pharmacy_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    pharmacy_region: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    pharmacy_address: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    price: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    availability_status: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    }
}, {
    freezeTableName: false,
    timestamps: true,
    modelName: 'zrPrices',
    sequelize
});

const createNewZrPrice = async (drugData) => {
    let res;
    try {
        res = await zrPrices.create({ ...drugData });
        res = res.dataValues;
    } catch (err) {
        console.error(`Impossible to create drug: ${err}`);
    }
    return res;
};


const updateZrPrice = async (id, price) => {
    const res = await zrPrices.update({ price } , { where: { id } });
    if (res[0]) {
            return res[0];
    } 
    return undefined;
};

const findZdorovaPriceByDrugPharmacy = async (drug_id, pharmacy_id) => {
    const res = await zrPrices.findOne({ where: { drug_id, pharmacy_id }});
    if (res) return res.dataValues;
    return;
}

const findALLZrPrices = async () => {
    const res = await zrPrices.findAll({ where: {  } });
    if (res.length > 0) return res.map(el => el.dataValues);
    return;
};

export {
    zrPrices,
    createNewZrPrice,
    updateZrPrice,
    findZdorovaPriceByDrugPharmacy,
    findALLZrPrices,
};   