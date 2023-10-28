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

const createNameByUrls = (sourceUrl, mainPageUrl, setExtension = '.html', setExtensionForce = false) => {
    const urlObj = configureUrlObj(sourceUrl, mainPageUrl);
    if (setExtensionForce) {
        return [urlObj.name, setExtension].join('')
    }
    return [urlObj.name, urlObj.extension || setExtension].join('')
}

// ========== Basic File System and Crawling Functions ===========
const crawlContent = (url, crawlingOptions) => {
    return axios.get(url, crawlingOptions)
        .then((response) => response.data)
        // .catch((error) => {
        //     console.error(`Axios error occured by url ${url}:`, error.message, error.stack)
        //     process.exit(1);
        // })
        .then((data) => {
            if (crawlingOptions.responseType) {
                return Buffer.from(data);
            }
            return data;
        })
}

const saveContent = (data, outputDirPath, sourceUrl, mainPageUrl) => {
    const fileName = createNameByUrls(sourceUrl, mainPageUrl);
    const fullFilePath = path.join(outputDirPath, fileName);
    return fs.promises.writeFile(fullFilePath, data, 'utf-8')
        .then(() => fullFilePath)
        .catch((error) => {
            if (error && error.code && error.syscall) {
                console.error('Error writing to file:', error.message, error.stack);
                process.exit(1);
            }
            throw error;
        });
}

const createDir = (dirFullPath) => {
    return fs.promises.mkdir(dirFullPath)
        .catch((error) => {
            console.error(`Directory can not be created:`, error.message, error.stack);
            process.exit(1);
        })
}

const crawlAndSaveContent = (fullOutputDirPath, sourceUrl, mainPageUrl = sourceUrl, crawlingOptions = {}) => {
    return crawlContent(sourceUrl, crawlingOptions)
        .then((data) => saveContent(data, fullOutputDirPath, sourceUrl, mainPageUrl));
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

    const tasks = urlsToCrawl.map((sourceUrl) => ({
        title: sourceUrl,
        task: (_ctx, task) => crawlAndSaveContent(sourcesOutputDirPath, sourceUrl, mainPageUrl, { responseType: 'arraybuffer' }).catch((error) => {
            if (axios.isAxiosError(error)) {
                task.skip(error.message);
            } else {
                throw error;
            }
        })
    }));

    const taskList = new Listr(tasks, { concurrent: true });

    return taskList.run();
}

const changeAndSaveMainFilePromise = (mainFilePath, data, sourcesOutputDirPath, mainPageUrl, elementConfigs) => {
    const changedData = changeUrlValuesInData(data, sourcesOutputDirPath, mainPageUrl, elementConfigs);
    return fs.promises.writeFile(mainFilePath, changedData, 'utf-8');
}

const isLocalSource = (sourceUrl, mainPageUrl) => {
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
    const sourcesDirName = createNameByUrls(mainPageUrl, mainPageUrl, '_files', true);
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

export { crawlAndSaveContent, saveContent, createDir, crawlContent };