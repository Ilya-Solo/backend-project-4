import * as cheerio from 'cheerio';
import createNameByUrl from '../createNameByUrl.js'
import path from 'path';
import fs from 'fs';
import saveData from '../savePage.js';

const extractImagesUrls = (data) => {
    const $ = cheerio.load(data);
    const imageUrls = [];
    $('img').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
            imageUrls.push(src);
        }
    });
    return imageUrls;
};

const saveImage = (filesDirPath, imageUrl) => saveData(filesDirPath, imageUrl);

const saveImages = (mainDirectoryPath, mainPageUrl, data) => {
    const filesDirName = createNameByUrl(mainPageUrl, '_files');
    const filesDirPath = path.join(mainDirectoryPath, filesDirName);
    return fs.promises.mkdir(filesDirPath)
        .catch((error) => { console.log('Something went wrong with files directory creating:', error) })
        .then(() => extractImagesUrls(data))
        .then((imagesUrls) => {
            return imagesUrls.map((imageUrl) => saveImage(filesDirPath, imageUrl));
        })
};

export default saveImages;
// path -> data ->
//     [extract urls + load images + save images, change_urls_in_html + save result]
