import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import createNameByUrls from './createNameByUrl.js';

const crawlContent = (url, crawlingOptions) => {
    return axios.get(url, crawlingOptions)
        .then((response) => response.data)
        .then((data) => {
            if (crawlingOptions.responseType) {
                return Buffer.from(data);
            }
            return data;
        })
        .catch((error) => {
            console.error(`An error occurred while downloading the content by url ${url}:`, error);
        });
}

const saveContent = (data, outputDirPath, sourceUrl, mainPageUrl) => {
    const fileName = createNameByUrls(sourceUrl, mainPageUrl);
    const fullFilePath = path.join(outputDirPath, fileName);
    return fs.promises.writeFile(fullFilePath, data, 'utf-8')
        .then(() => fullFilePath)
        .catch((error) => {
            console.error('Error writing to file:', error);
        });
}

const createDir = (dirFullPath) => {
    return fs.promises.stat(dirFullPath)
        .catch(() => false)
        .then((isDirectory) => !!isDirectory)
        .then((isDirExists) => {
            if (isDirExists) {
                return fs.promises.rm(dirFullPath, { recursive: true });
            }
        })
        .then(() => fs.promises.mkdir(dirFullPath))
}

const crawlAndSaveContent = (fullOutputDirPath, sourceUrl, mainPageUrl = '', crawlingOptions = {}) => {
    return crawlContent(sourceUrl, crawlingOptions)
        .then((data) => saveContent(data, fullOutputDirPath, sourceUrl, mainPageUrl))
}

const extractUrlsFromData = (data, mainPageUrl, elementConfigs) => {
    const $ = cheerio.load(data);
    const urls = [];
    elementConfigs.forEach((elementConfig) => {
        $(elementConfig.elementName).each((_, element) => {
            const src = $(element).attr(elementConfig.attribute);
            if (src && elementConfig.condition(src, mainPageUrl)) {
                urls.push(src);
            }
        });
    });

    return attrValues;
}

const changeUrlValuesInData = (data, sourcesOutputDirPath, mainPageUrl, elementConfigs) => {
    const $ = cheerio.load(data);
    const sourcesOutputDirName = path.basename(sourcesOutputDirPath);
    elementConfigs.forEach((elementConfig) => {
        $(elementConfig.elementName).each((_, element) => {
            const src = $(element).attr(elementConfig.attribute);
            if (src && elementConfig.condition(src, mainPageUrl)) {
                const fullPath = path.join(sourcesOutputDirName, createNameByUrl(src, mainPageUrl));
                $(element).attr(elementConfig.attribute, fullPath);
            }
        });
    });

    return $.html();
}

const saveSourcesPromise = (data, sourcesOutputDirPath, mainPageUrl, elementConfigs) => {
    const sourcesSavePromisesArr = extractUrlsFromData(data, mainPageUrl, elementConfigs)
        .map((sourceUrl) => crawlAndSaveContent((sourcesOutputDirPath, sourceUrl, mainPageUrl, { responseType: 'arraybuffer' })));
    return Promise.all(sourcesSavePromisesArr);
}

const changeAndSaveMainFilePromise = (mainFilePath, data, sourcesOutputDirPath, mainPageUrl, elementConfigs) => {
    const changedData = changeUrlValuesInData(data, sourcesOutputDirPath, mainPageUrl, elementConfigs);
    return fs.promises.writeFile(mainFilePath, changedData, 'utf-8');
}

const sourcesProcessingPromise = () => {

}

// crawlAndSaveContent('tmp', 'https://a.allegroimg.com/s180/1139a2/9db274c84ee88e2fe2c33e7876a6/DLUGA-LETNIA-SUKIENKA-DAMSKA-BAWELNIANA-WZORY-XXL.png', '', { responseType: 'arraybuffer' })
//     .then((data) => console.log(data))
