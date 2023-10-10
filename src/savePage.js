import axios from 'axios';
import fs from 'fs';
import createNameByUrl from './createNameByUrl.js';
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

const crawlAndSaveData = (directory, url, opts = {}) => {
  const fileName = createNameByUrl(url);
  const filePath = path.join(directory, fileName);

  return loadPage(url, opts)
    .then((data) => {
      if (opts.responseType) {
        return Buffer.from(data)
      }
      return data;
    })
    .then((data) => saveData(filePath, data))
    .then(() => filePath);
}

export { saveData, loadPage };
export default crawlAndSaveData;
