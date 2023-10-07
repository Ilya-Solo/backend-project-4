import { savePage, loadPage } from './src/savePage.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
savePage('/var/folders/dz/gxrwt_m94rj9lk8dhfpvdb0h0000gn/T/page-loader-0A1K9r', 'https://ru.hexlet.io/courses', loadPage);
// const directoryPath = path.join(os.tmpdir(), 'page-loader-')
// const a = await fs.promises.mkdtemp(directoryPath);
// console.log(a);
// loadPage('https://ru.hexlet.io/courses')