import { zrNames } from '../models/zrNames.js';
import { zrPrices } from '../models/zrPrice.js';

const DEBUG = true;

const main = async () => {
    try {
        const syncState = await Promise.all([
            zrNames.sync(),
            zrPrices.sync()
        ]);
        
        /*
        if (DEBUG && syncState) {
            const drugData = {
                drug_name: 'лалалал',
            };

            createNewZnahar(drugData);
        }
*/
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
    }
};

main();
