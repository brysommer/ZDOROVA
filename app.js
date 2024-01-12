import axios from 'axios';
import XLSX from 'xlsx';
import { logger } from './logger/index.js';
import { sequelize } from './models/sequelize.js';
import {  findZrNameById, findAllNames } from './models/zrNames.js';
import { findZdorovaPriceByDrugPharmacy, createNewZrPrice, updateZrPrice, findALLZrPricesbyCity } from './models/zrPrice.js';


const sharedFolderPath = '../price/SynologyDrive/';



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
    const response = await axios.get(`https://zr.in.ua/product/${search}/prices`);
    if (response.status === 404) return false;
    return response.data.data;
  } catch (error) {
    console.error('Помилка при отриманні XML: ', error.code);
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
  const zrNamesDB = await findAllNames();
  for (let i = 11950; i < 34377; i++) {
    if (i % 100 === 0) {
      logger.info(`Здорова обробляє елемент #${i}`)
    }
    console.log(i);

    //const zrName = await findZrNameById(i);

    const data = await getApiData(zrNamesDB[i].drug_id);
    if (data) {
      if (data.prices.other.length > 0) {
        const otherCities = data.prices.other;
        for (const el of otherCities) {
          const element = await findZdorovaPriceByDrugPharmacy(zrNamesDB[i].drug_id, el.pharmacy_id);
          if (element) {
            await updateZrPrice(element.id, el.price);
          } else {
            const location = textBeforeComma(el.pharmacy.address);
            await createNewZrPrice({
              drug_id: el.product_id,
              drug_name: data.product.name,
              drug_producer: '',
              pharmacy_id: el.pharmacy_id,
              pharmacy_name: el.pharmacy.title,
              pharmacy_region: location[0],
              pharmacy_address: location[1],
              price: el.price_old,
              availability_status: 'Забронювати',
            })  
          }
        }
        

      }
      if (data.prices.current_city.length > 0) {
        const current_city = data.prices.other;
        for (const el of current_city) {
          const element = await findZdorovaPriceByDrugPharmacy(zrNamesDB[i].drug_id, el.pharmacy_id);
          if (element) {
            await updateZrPrice(element.id, el.price);
          } else {
            const location = textBeforeComma(el.pharmacy.address);
            await createNewZrPrice({
              drug_id: el.product_id,
              drug_name: data.product.name,
              drug_producer: '',
              pharmacy_id: el.pharmacy_id,
              pharmacy_name: el.pharmacy.title,
              pharmacy_region: location[0],
              pharmacy_address: location[1],
              price: el.price_old,
              availability_status: 'Забронювати',
            })  
          }
        }
      }
    }
  }
}


/*
function convertArrayToSheet(APIdata) {
  if (APIdata.prices.other[0] == undefined) {
    return
  }


  console.log(APIdata.prices.other[0])
  APIdata.prices.other.forEach((item) => {

        const location = textBeforeComma(item.pharmacy.address);

        csvData.push([
          '0',
          item.product_id,
          APIdata.product.name,
          'невідомо',
          item.pharmacy_id,
          item.pharmacy.title,
          location[0],
          location[1],
          item.price_old,
          'Забронювати',
          new Date(),
        ]
        );
  });
  //return csvData;
}




async function run() {
  try {
    
    for (let i = 60; i < 360; i++) {
      const apiData = await getApiData(i);
      const dataArray = convertArrayToSheet(apiData);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    //const dataArray = convertArrayToSheet(apiData);
    writeArrayToXLS(csvData, 'ZdorovaRoduna.xls');
  } catch (error) {
    console.error('Помилка: ', error);
  }
}

run();
*/

/*
const generateNumbers = async () => {
  try {
    for (let i = 32202; i <= 34376; i++) { 
        console.log(i) 
        const xml = await getApiData(i);
        if (xml) {
          createNewName({
            drug_name: xml.product.name,
            drug_id: i,
          })

        }
    }
  
  } catch (error) {
    console.error('Помилка: ', error);
  }
}

generateNumbers();
*/
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
    
    logger.info(`Записано ${sheets.length} частин, ${arrayData.length} элементів в ${xlsFilePath.slice(0, 9)}`);
    console.log('Масив успішно записано в XLS.');
  } catch (error) {
    logger.warn(`Масив: ${arrayData.length} Шлях: ${xlsFilePath} Помилка під час запису масиву в XLS:`, error)
    console.error('Помилка під час запису масиву в XLS:', error);
  }
}

const zdorovaLocations = [
  'Львів',
  'Івано-Франківськ',
  'Трускавець',
  'Моршин',
  'Стебник',
  'Дрогобич',
  'Коломия',
  'Долина',
  'Болехів',
  'Брошнів',
  'Галич',
  'Ужгород'
]



async function run() {
  
  try {
   // await runZdorova();
    
    let csvDataZr = [[
      'id',
      'drug_id',
      'drug_name',
      'drug_producer',
      'pharmacy_id',
      'pharmacy_name',
      'pharmacy_region',
      'pharmacy_address',
      'price',
      'availability_status',
      'updated_at',
    ]]; 

    for (city in zdorovaLocations) {
      const cityDataZr = await findALLZrPricesbyCity(city);
      logger.info(`${cityDataZr.length} довжина Здорової в місті ${city}`)
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

    const date = new Date();
    const filename = date.toISOString().replace(/T/g, "_").replace(/:/g, "-");
    console.log(`Довжина здорова родина:${csvDataZr.length}`);
    writeArrayToXLS(csvDataZr, `priceZdorova${filename}.xls`);
    await new Promise(resolve => setTimeout(resolve, 300000));
    csvDataZr = [];
    
  } catch (error) {
    console.error('Помилка здорова родина: ', error);
  }
  run();
};

run();




