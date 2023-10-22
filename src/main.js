import savePage from "./saveAndCrawlData.js";
import fs from 'fs';
const a = await fs.promises.readdir('./tmp/ru-hexlet-io-courses_files')
console.log(a)
export default savePage;