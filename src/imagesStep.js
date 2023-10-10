import * as cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';
import crawlAndSaveData, { saveData } from './savePage.js';
import createNameByUrl from './createNameByUrl.js';

// ##########################
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

const saveImage = (directoryPath, url) => crawlAndSaveData(directoryPath, url, { responseType: 'arraybuffer' });

const saveImages = (outpuDir, mainPageUrl, data) => {
    const filesDirName = createNameByUrl(mainPageUrl, '_files');
    const filesDirFullPath = path.join(outpuDir, filesDirName);

    return fs.promises.stat(filesDirFullPath)
        .catch(() => false)
        .then((isDirectory) => !!isDirectory)
        .then((isFilesDirExists) => {
            if (isFilesDirExists) {
                return fs.promises.rm(filesDirFullPath, { recursive: true });
            }
        })
        .then(() => fs.promises.mkdir(filesDirFullPath))
        .then(() => {
            return extractImagesUrls(data).map((imageUrl) => saveImage(filesDirFullPath, imageUrl));
        })
}

// ##########################

const changeImageUrlsInHtml = (mainPageUrl, data) => {
    const $ = cheerio.load(data);
    const imagesDirectoryName = createNameByUrl(mainPageUrl, '_files');
    $('img').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
            const fullPath = path.join(imagesDirectoryName, createNameByUrl(src));
            $(element).attr('src', fullPath);
        }
    });

    return $.html();
}

const saveDataWithChangedUrls = (mainFilePath, mainPageUrl, data) => {
    const changedData = changeImageUrlsInHtml(mainPageUrl, data);
    return saveData(mainFilePath, changedData);
}

// ##########################

const imagesProcessingStep = (mainFilePath, outpuDir, mainPageUrl) => {
    fs.promises.readFile(mainFilePath)
        .then((data) => {
            const saveImagesPromise = saveImages(outpuDir, mainPageUrl, data);
            const changeImagesInHtmlPromise = saveDataWithChangedUrls(mainFilePath, mainPageUrl, data);
            return [saveImagesPromise, changeImagesInHtmlPromise];
        })
}

export default imagesProcessingStep;