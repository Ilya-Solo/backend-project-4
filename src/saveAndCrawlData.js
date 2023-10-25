import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import createDebug from 'debug';
import Listr from 'listr';

const debug = createDebug('page-loader');

// ================= Create Name By Urls Function ================
const configureUrlObj = (sourceUrl, mainPageUrl) => {
    const mainPageUrlOrigin = (new URL(mainPageUrl)).origin;
    const sourceUrlObj = new URL(sourceUrl, mainPageUrlOrigin);
    const extensionMatch = sourceUrlObj.href.match(/(\.[A-Za-z0-9]+$)/);
    let extension;
    if (extensionMatch && extensionMatch[1]) {
        extension = extensionMatch[1].toLowerCase();
    }
    const fileName = `${sourceUrlObj.hostname}${sourceUrlObj.pathname}`
        .replace(extension, '')
        .replace(/[^A-Za-z0-9]/g, '-');
    return { name: fileName, extension: extension || '' }
}

const createNameByUrls = (sourceUrl, mainPageUrl, setExtension = '.html') => {
    const urlObj = configureUrlObj(sourceUrl, mainPageUrl);
    return [urlObj.name, urlObj.extension || setExtension].join('')
}

// ========== Basic File System and Crawling Functions ===========
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
            if (error.response) {
                console.error(`Data by url ${url} can not be crawled. ${error.message}. Will be saved with empty content`);
                return '';
            }
            console.error(`Axios error occured by url ${url}:`, error.message)
            process.exit(1);
        })
}

const saveContent = (data, outputDirPath, sourceUrl, mainPageUrl) => {
    const fileName = createNameByUrls(sourceUrl, mainPageUrl);
    const fullFilePath = path.join(outputDirPath, fileName);
    return fs.promises.writeFile(fullFilePath, data, 'utf-8')
        .then(() => fullFilePath)
        .catch((error) => {
            console.error('Error writing to file:', error.message);
            process.exit(1);
        });
}

const createDir = (dirFullPath) => {
    return fs.promises.mkdir(dirFullPath)
        .catch((error) => {
            console.error(`Directory can not be created:`, error.message);
            process.exit(1);
        })
}

const crawlAndSaveContent = (fullOutputDirPath, sourceUrl, mainPageUrl = sourceUrl, crawlingOptions = {}) => {
    return crawlContent(sourceUrl, crawlingOptions)
        .then((data) => saveContent(data, fullOutputDirPath, sourceUrl, mainPageUrl))
        .catch(error => console.log(error))
}

// ================ Sources Processing Functions =================
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

    return urls;
}

const changeUrlValuesInData = (data, sourcesOutputDirPath, mainPageUrl, elementConfigs) => {
    const $ = cheerio.load(data);
    const sourcesOutputDirName = path.basename(sourcesOutputDirPath);
    elementConfigs.forEach((elementConfig) => {
        $(elementConfig.elementName).each((_, element) => {
            const src = $(element).attr(elementConfig.attribute);
            if (src && elementConfig.condition(src, mainPageUrl)) {
                const fullPath = path.join(sourcesOutputDirName, createNameByUrls(src, mainPageUrl));
                $(element).attr(elementConfig.attribute, fullPath);
            }
        });
    });

    return $.html();
}

const saveSourcesPromise = (data, sourcesOutputDirPath, mainPageUrl, elementConfigs) => {
    const urlsToCrawl = extractUrlsFromData(data, mainPageUrl, elementConfigs)
        .map((sourceUrl) => (new URL(sourceUrl, mainPageUrl)).href);

    console.log(urlsToCrawl)
    const tasks = urlsToCrawl.map((sourceUrl) => ({
        title: sourceUrl,
        task: () => crawlAndSaveContent(sourcesOutputDirPath, sourceUrl, mainPageUrl, { responseType: 'arraybuffer' })
    }));

    const taskList = new Listr(tasks, {
        concurrent: true, // Adjust this to control the level of concurrency
        exitOnError: false, // Continue with other tasks even if one fails
    });

    return taskList.run();


    // const sourcesSavePromisesArr = extractUrlsFromData(data, mainPageUrl, elementConfigs)
    //     .map((sourceUrl) => (new URL(sourceUrl, mainPageUrl)).href)
    //     .map((sourceUrl) => crawlAndSaveContent(sourcesOutputDirPath, sourceUrl, mainPageUrl, { responseType: 'arraybuffer' }));
    // return Promise.all(sourcesSavePromisesArr);
}

const changeAndSaveMainFilePromise = (mainFilePath, data, sourcesOutputDirPath, mainPageUrl, elementConfigs) => {
    const changedData = changeUrlValuesInData(data, sourcesOutputDirPath, mainPageUrl, elementConfigs);
    return fs.promises.writeFile(mainFilePath, changedData, 'utf-8');
}

const isLocalSource = (sourceUrl, mainPageUrl) => {
    if (sourceUrl.includes('localhost')) {
        return false
    }
    const mainPageUrlObject = new URL(mainPageUrl);
    const sourceUrlObject = new URL(sourceUrl, mainPageUrlObject.origin);
    return sourceUrlObject.hostname === mainPageUrlObject.hostname;
}

const elementConfigs = [
    { elementName: 'img', attribute: 'src', condition: () => true },
    { elementName: 'link', attribute: 'href', condition: isLocalSource },
    { elementName: 'script', attribute: 'src', condition: isLocalSource },
];

const sourcesProcessingPromise = (outputDir, mainPageUrl, mainFilePath) => {
    const sourcesDirName = createNameByUrls(mainPageUrl, mainPageUrl, '_files');
    const sourcesDirFullPath = path.join(outputDir, sourcesDirName);
    return createDir(sourcesDirFullPath)
        .then(() => fs.promises.readFile(mainFilePath))
        .then((data) => {
            const sourcesSave = saveSourcesPromise(data, sourcesDirFullPath, mainPageUrl, elementConfigs);
            const mainFileChange = changeAndSaveMainFilePromise(mainFilePath, data, sourcesDirFullPath, mainPageUrl, elementConfigs);
            return Promise.all([sourcesSave, mainFileChange]);
        })
}

// =================== Main Page Save Function ===================
const savePage = (outputDir, mainPageUrl) => {
    let mainFilePath;
    debug('Start main page crawling')
    return crawlAndSaveContent(outputDir, mainPageUrl)
        .then((filepath) => {
            mainFilePath = filepath;
            debug('Main page content has been crawled');
            debug('Start sources crawling')
            return filepath;
        })
        .then((filepath) => {
            return sourcesProcessingPromise(outputDir, mainPageUrl, filepath)
        })
        .then(() => {
            debug('Sources have been crawled')
            return mainFilePath
        });
}

export default savePage;

export { crawlAndSaveContent };