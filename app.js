import axios from 'axios';
import XLSX from 'xlsx';
import { logger } from './logger/index.js';
import { sequelize } from './models/sequelize.js';
import { findAllNames, deleteOutdatedName } from './models/zrNames.js';
import { 
  findZdorovaPriceByDrugPharmacy,
  createNewZrPrice,
  updateZrPrice,
  findALLZrPrices,
  updateZrPriceNew
 } from './models/zrPrice.js';
import fs from 'fs/promises';

const v8 = require('v8');

console.log(v8.getHeapStatistics().max_old_space_size);

const filePath = './pharmacy_ids.json';
const sharedFolderPath = '../../price/SynologyDrive/';

let oldFileName;


const main = async () => {
  const models = {
      list:  [
          'zrNames'
      ]
  };
  // DB
  const configTables = models.list;
  const dbInterface = sequelize.getQueryInterface();
  try {
    const checks = await Promise.all(configTables.map(configTable => {
        return dbInterface.tableExists(configTable);
    }));
    const result = checks.every(el => el === true);
    if (!result) {
        // eslint-disable-next-line no-console
        console.error(`🚩 Failed to check DB tables`);
        throw (`Some DB tables are missing`);
    }
  } catch (error) {
    console.error(`🚩 egfrsgs ${error}` );

  }
  

}; 

main();






const getApiData = async(search) => {
  try {
    const response = await axios.post(`https://zr.in.ua/product/${search}/prices`,
    {
      _token: 'TSq8Bt2sWlGMhXlgIjOEPbN4P7gZnXfjD6cKb7n2',
      sort: 'distance|asc',
      page: 1
    },
    {
      headers: {
          "Cookie": " XSRF-TOKEN=eyJpdiI6IlF3c3FFOFQyQ2pyUFVzcVd6a2daQkE9PSIsInZhbHVlIjoiWkJmTm9XWWowZ2tvZHBhK29xWUxtRTlvSW1NZ3R2TWMvNVpkWU5wY1hCbzVjb2ZlUDYzR2dCSjB3UjRRN2Mvd0tIaGx0SmRrcEVCdHJaMVZEdnA0QzJRTWE4OFJjZFVpc0xjb0Y2ZTQ3dXNraVZEWTZnclpjKzJVSXhDekgwWkwiLCJtYWMiOiJkMjRlZjc2MmJhNzJhZDAxNDMyYTc1OTdmYzZmMjYxZDQ1YjJmODFiYmU4ZDcxNTg0Y2YyYTVjMDc1YzMyYmNjIiwidGFnIjoiIn0%3D; zdorova_rodyna_session=eyJpdiI6IlpKL0xtd0lTTG1EL1BhMiszRS92VVE9PSIsInZhbHVlIjoiRkpkcFVyeWY3OHczREd6MXdUUVI4VmhSRnRDc0lzWFNUUzg3QnY0U1hZSldRZWhsOEcyY0JZTDF2MXNvUHFEbkRsNkNHQ1czOHpFOXMrQU8rVFp0V2FZZFVKMld6SDNUQlMzM21SVmNwSFpBelJxWXQvNFQwT0NnTVA1ZWMrangiLCJtYWMiOiIzZTM0ODJiMTkxODhiMWQ5Y2YwOWFmZTk3YjcwMmQzM2JmNjIxNDM0ZTliODE3ZTQ1MjkwYmE1ZGEzZGIwNWU0IiwidGFnIjoiIn0%3D;",
        }
    }

    );
    console.log(response.data.succsess)
    if (response.status === 404) return false;
    if (response.data.succsess != true) {
      logger.warn(`Невдалий запит до Здорової товар #: ${search} Причина: ${response.data.succsess} `);
      return false;
    };
    return response.data.data;
  } catch (error) {
    console.error('Помилка при отриманні XML: ', error.code);
    logger.warn(`Невдалий запит до Здорової товар #: ${search} Причина: ${error.code} `);

    return false;
  }

}


function textBeforeComma(text) {

  if (!text.includes(",")) {
    return ['null', 'null'];
  }

  return text.split(",");
}



const runZdorova = async () => {
  
  const data = await fs.readFile(filePath, 'utf8');
  
  const parsedData = JSON.parse(data);
  console.log(parsedData.length)
  const pharmacyIds = parsedData.map(s => Number(s));
  let zrNames = [];
  while (true) {
    if (zrNames.length === 0) {
      zrNames = await findAllNames(); 
    }
      
    const index = Math.floor(Math.random() * zrNames.length);
      
    const name = zrNames[index];
      
    const data = await getApiData(name.drug_id);

    if (data) {
      console.log(`Данні${data.prices.prices_map.length}`)

      if (data.prices.prices_map.length === 0) {
        await deleteOutdatedName(name.drug_id)
      }

      if (data.prices.prices_map.length > 0) {
        const otherCities = data.prices.prices_map;
        console.log(`Other cities length: ${otherCities.length}`)
        const matchedPharmacys = [];

        for (let i = 0; i < otherCities.length; i++) {
          const pharmacy = otherCities[i];
          
          if (pharmacyIds.includes(pharmacy.pharmacy_id)) {
            matchedPharmacys.push(pharmacy); 
          }
          
        }
        console.log(`matchedPharmacys: ${matchedPharmacys.length}`)
        for (const pharmacy of matchedPharmacys) {
          const element = await findZdorovaPriceByDrugPharmacy(name.drug_id, pharmacy.pharmacy_id);
          if (element) {
            const update = await updateZrPriceNew(element.id, pharmacy.price, pharmacy.price_old, pharmacy.quantity);
          } else {
            const location = textBeforeComma(pharmacy.pharmacy.address);
            await createNewZrPrice({
              drug_id: pharmacy.product_id,
              drug_name: data.product.name,
              drug_producer: pharmacy.price_old,
              pharmacy_id: pharmacy.pharmacy_id,
              pharmacy_name: pharmacy.pharmacy.title,
              pharmacy_region: location[0],
              pharmacy_address: location[1],
              price: pharmacy.price,
              availability_status: pharmacy.quantity,
            })  
          }
        }
      }
    }

      
    zrNames.splice(index, 1);

    if (zrNames.length % 1000 === 0) {
      logger.info(`Здорова залишилось елементів #${zrNames.length}`)
    }
    if (zrNames.length % 1 === 0) {
      
      await writeDB();

    }
    console.log(`Drag ID: ${name.drug_id}, ZR names lenght: ${zrNames.length}`);

  }
}

const writeArrayToXLSX = (arrayData, xlsxFilePath) => {

  const worksheet = XLSX.utils.aoa_to_sheet(arrayData);
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  XLSX.writeFile(workbook, sharedFolderPath+xlsxFilePath);

  logger.info(`Записано ${arrayData.length} елементів, в файл ${xlsxFilePath.slice(0, 9)}`);
  
  console.log("Здорова XLSX");
}


const writeArrayToXLS = (arrayData, xlsFilePath) => {
  try {
    const maxRowsPerSheet = 50000;
    const sheets = [];
    let count = 1;
    
    for(let i = 0; i < arrayData.length; i += maxRowsPerSheet) {
      const chunk = arrayData.slice(i, i + maxRowsPerSheet);
      const sheetName = `PART_${count++}`; 
      
      const worksheet = XLSX.utils.aoa_to_sheet(chunk);
      sheets.push({name: sheetName, worksheet});
    }
    
    const workbook = XLSX.utils.book_new();
    
    sheets.forEach(sheet => {
      XLSX.utils.book_append_sheet(workbook, sheet.worksheet, sheet.name); 
    });
    
    XLSX.writeFile(workbook, sharedFolderPath + xlsFilePath);
    console.log(sheets.length, arrayData.length, xlsFilePath)
    
    //logger.info(`Записано ${sheets.length} частин, ${arrayData.length} элементів в ${xlsFilePath.slice(0, 9)}`);
    console.log('Масив успішно записано в XLS.');
  } catch (error) {
    //logger.warn(`Масив: ${arrayData.length} Шлях: ${xlsFilePath} Помилка під час запису масиву в XLS:`, error)
    console.error('Помилка під час запису масиву в XLS:', error);
  }
}

async function writeDB() {
  
  try {
    
    let csvDataZr = [[
      'id',
      'drug_id',
      'drug_name',
      'discounted_price',
      'pharmacy_id',
      'pharmacy_name',
      'pharmacy_region',
      'pharmacy_address',
      'regular_price',
      'quantity',
      'updated_at',
    ]]; 

    const cityDataZr = await findALLZrPrices();
      
    for (const el of cityDataZr) {
      csvDataZr.push([
          el.id,
          el.drug_id,
          el.drug_name,
          el.drug_producer,
          el.pharmacy_id,
          el.pharmacy_name,
          el.pharmacy_region,
          el.pharmacy_address,
          el.price,
          el.availability_status,
          el.updatedAt
      ])
    }  

    logger.info(`${cityDataZr.length} - довжина Здорової`)
      /*
    for (city in zdorovaLocations) {
      const cityDataZr = await findALLZrPricesbyCity(city);
      //logger.info(`${cityDataZr.length} довжина Здорової в місті ${city}`)
      for (const el of cityDataZr) {
        csvDataZr.push([
          el.id,
          el.drug_id,
          el.drug_name,
          el.drug_producer,
          el.pharmacy_id,
          el.pharmacy_name,
          el.pharmacy_region,
          el.pharmacy_address,
          el.price,
          el.availability_status,
          el.updatedAt
        ])
      }  
    }
    */ 

    if(oldFileName) fs.unlink(sharedFolderPath + oldFileName);

    const date = new Date();
    const filename = date.toISOString().replace(/T/g, "_").replace(/:/g, "-");
    console.log(`Довжина здорова родина:${csvDataZr.length}`);
    oldFileName = `priceZdorova${filename}.xlsx`
    writeArrayToXLSX(csvDataZr, `priceZdorova${filename}.xlsx`);
    //writeArrayToXLS(csvDataZr, `priceZdorova${filename}.xls`);
    
    csvDataZr = [];
    
  } catch (error) {
    console.error('Помилка здорова родина: ', error);
  }
};

await runZdorova();




