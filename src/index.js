import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import createDebug from 'debug';
import Listr from 'listr';
import 'axios-debug-log';

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
  return { name: fileName, extension: extension || '' };
};

const createNameByUrls = ({
  sourceUrl,
  mainPageUrl,
  usageCase,
}) => {
  const urlObj = configureUrlObj(sourceUrl, mainPageUrl);

  switch (usageCase) {
    case 'Filename':
      return [urlObj.name, urlObj.extension || '.html'].join('');
    case 'Sourcesdir':
      return [urlObj.name, '_files'].join('');
    default:
      throw Error('No such a naming case');
  }
};

// ========== Basic File System and Crawling Functions ===========
const crawlContent = (url, crawlingOptions) => axios.get(url, crawlingOptions)
  .then((response) => response.data)
  .then((data) => {
    if (crawlingOptions.responseType === 'arraybuffer') {
      return Buffer.from(data);
    }
    return data;
  });

const saveContent = ({
  data,
  outputDirPath,
  sourceUrl,
  mainPageUrl,
}) => {
  const fileName = createNameByUrls({
    sourceUrl,
    mainPageUrl,
    usageCase: 'Filename',
  });
  const fullFilePath = path.join(outputDirPath.toString(), fileName);

  return fs.promises.writeFile(fullFilePath, data, 'utf-8')
    .then(() => fullFilePath);
};

const createDir = (dirFullPath) => fs.promises.mkdir(dirFullPath);

const crawlAndSaveContent = ({
  fullOutputDirPath,
  sourceUrl,
  mainPageUrl = sourceUrl,
  crawlingOptions = {},
}) => crawlContent(sourceUrl, crawlingOptions)
  .then((data) => saveContent({
    data,
    outputDirPath: fullOutputDirPath,
    sourceUrl,
    mainPageUrl,
  }));

// ================ Sources Processing Functions =================
const extractUrlsFromData = ({
  data,
  mainPageUrl,
  elementsConfig,
}) => {
  const $ = cheerio.load(data);
  const urls = Object.keys(elementsConfig)
    .flatMap((elementName) => $(elementName).toArray())
    .filter((element) => {
      const { attribute, condition } = elementsConfig[element.tagName];
      const src = $(element).attr(attribute);
      return src && condition(src, mainPageUrl);
    })
    .map((element) => {
      const { attribute } = elementsConfig[element.tagName];
      return $(element).attr(attribute);
    });

  return urls;
};

const changeUrlValuesInData = ({
  data,
  sourcesOutputDirPath,
  mainPageUrl,
  elementsConfig,
}) => {
  const $ = cheerio.load(data);
  const sourcesOutputDirName = path.basename(sourcesOutputDirPath);
  const selector = Object.keys(elementsConfig).join(', ');
  $(selector).toArray()
    .filter((element) => {
      const { attribute, condition } = elementsConfig[element.tagName];
      const src = $(element).attr(attribute);
      return src && condition(src, mainPageUrl);
    })
    .forEach((element) => {
      const { attribute } = elementsConfig[element.tagName];
      const src = $(element).attr(attribute);
      const fullPath = path.join(sourcesOutputDirName,
        createNameByUrls({
          sourceUrl: src,
          mainPageUrl,
          usageCase: 'Filename',
        }));
      $(element).attr(attribute, fullPath);
    });

  return $.html();
};

const saveSourcesPromise = ({
  data,
  sourcesOutputDirPath,
  mainPageUrl,
  elementsConfig,
}) => {
  const urlsToCrawl = extractUrlsFromData({
    data,
    mainPageUrl,
    elementsConfig,
  })
    .map((sourceUrl) => (new URL(sourceUrl, mainPageUrl)).href);

  const tasks = urlsToCrawl.map((sourceUrl) => ({
    title: sourceUrl,
    task: () => crawlAndSaveContent({
      fullOutputDirPath: sourcesOutputDirPath,
      sourceUrl,
      mainPageUrl,
      crawlingOptions: {
        responseType: 'arraybuffer',
      },
    }),
  }));

  const taskList = new Listr(tasks, { concurrent: true });

  return taskList.run();
};

const changeAndSaveMainFilePromise = ({
  mainFilePath,
  data,
  sourcesOutputDirPath,
  mainPageUrl,
  elementsConfig,
}) => {
  const changedData = changeUrlValuesInData({
    data,
    sourcesOutputDirPath,
    mainPageUrl,
    elementsConfig,
  });
  return fs.promises.writeFile(mainFilePath, changedData, 'utf-8');
};

const isLocalSource = (sourceUrl, mainPageUrl) => {
  const mainPageUrlObject = new URL(mainPageUrl);
  const sourceUrlObject = new URL(sourceUrl, mainPageUrlObject.origin);
  return sourceUrlObject.hostname === mainPageUrlObject.hostname;
};

const elementsConfig = {
  img: {
    attribute: 'src',
    condition: () => true,
  },
  link: {
    attribute: 'href',
    condition: isLocalSource,
  },
  script: {
    attribute: 'src',
    condition: isLocalSource,
  },
};

const processSources = ({
  outputDir,
  mainPageUrl,
  mainFilePath,
}) => {
  const sourcesDirName = createNameByUrls({
    sourceUrl: mainPageUrl,
    mainPageUrl,
    usageCase: 'Sourcesdir',
  });
  const sourcesDirFullPath = path.join(outputDir, sourcesDirName);
  return createDir(sourcesDirFullPath)
    .then(() => fs.promises.readFile(mainFilePath))
    .then((data) => {
      const sourcesSave = saveSourcesPromise({
        data,
        sourcesOutputDirPath: sourcesDirFullPath,
        mainPageUrl,
        elementsConfig,
      });
      const mainFileChange = changeAndSaveMainFilePromise({
        mainFilePath,
        data,
        sourcesOutputDirPath: sourcesDirFullPath,
        mainPageUrl,
        elementsConfig,
      });
      return Promise.all([sourcesSave, mainFileChange]);
    });
};

// =================== Main Page Save Function ===================
const savePage = (mainPageUrl, outputDir = process.cwd()) => {
  let mainFilePath;
  debug('Start main page crawling');
  return crawlAndSaveContent({
    fullOutputDirPath: outputDir,
    sourceUrl: mainPageUrl,
  })
    .then((filepath) => {
      mainFilePath = filepath;
      debug('Main page content has been crawled');
      debug('Start sources crawling');
      return filepath;
    })
    .then((filepath) => processSources({
      outputDir,
      mainPageUrl,
      mainFilePath: filepath,
    }))
    .then(() => {
      debug('Sources have been crawled');
      return mainFilePath;
    });
};

export default savePage;
