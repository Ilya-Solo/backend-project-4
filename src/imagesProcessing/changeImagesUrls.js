import * as cheerio from 'cheerio';
import createNameByUrl from '../createNameByUrl.js'
import path from 'path';
import saveData from '../savePage.js'
import { data } from 'cheerio/lib/api/attributes.js';

const changeUrlsInHtml = (filePath, data) => {
    const $ = cheerio.load(data);
    $('img').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
            const fullPath = path.join(filePath, createNameByUrl(src));
            $(element).attr('src', fullPath);
        }
    });

    return $.html();
}

const relativeImagePath = (mainFilePath) => {
    const directoryName = path.basename(mainFilePath).name;
    const processedDirectoryName = createNameByUrl(directoryName)
}

const saveDataWithChangedUrls = (path, data) => {
    const changedData = changeUrlsInHtml(path, data);
    return fs.promises.writeFile(path, changedData, 'utf-8');
}
