import * as cheerio from 'cheerio';
import createNameByUrl from '../createNameByUrl.js'
import path from 'path';
import saveData from '../savePage.js';

const changeImageUrlsInHtml = (url, data) => {
    const $ = cheerio.load(data);
    const imagesDirectoryName = createNameByUrl(url, '_file');
    $('img').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
            const fullPath = path.join(imagesDirectoryName, createNameByUrl(src));
            $(element).attr('src', fullPath);
        }
    });

    return $.html();
}

const saveDataWithChangedUrls = (fullPath, url, data) => {
    const changedData = changeImageUrlsInHtml(url, data);
    return saveData(fullPath, changedData);
}

export default saveDataWithChangedUrls;
