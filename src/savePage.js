import axios from 'axios';
import fs from 'fs';
import createNameByUrls from './createNameByUrl.js';
import path from 'path';

const saveData = (fullPath, data) => {
  return fs.promises.writeFile(fullPath, data, 'utf-8')
    .then(() => fullPath)
    .catch((error) => {
      console.error('Error writing to file:', error);
    });
}

const loadPage = (url, options) => {
  return axios.get(url, options)
    .then((response) => response.data)
    .catch((error) => {
      console.error('An error occurred while downloading the page:', error);
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

const crawlAndSaveData = (directory, url, mainPageUrl, opts = {}) => {
  const fileName = createNameByUrls(url, mainPageUrl);
  const filePath = path.join(directory, fileName);

  return loadPage(url, opts)
    .then((data) => {
      if (opts.responseType) {
        return Buffer.from(data);
      }
      return data;
    })
    .then((data) => saveData(filePath, data))
    .then(() => filePath)
    .catch(error => console.log('Aaaaaaaaaaaaa', url, error));
}

export { saveData, loadPage, createDir };
export default crawlAndSaveData;
