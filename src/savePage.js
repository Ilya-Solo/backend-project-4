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

const loadPage = (url) => {
  return axios.get(url)
    .then((response) => response.data)
    .catch((error) => {
      console.error('An error occurred while downloading the page:', error);
    });
}

const savePrimaryPage = (directory, url) => {
  const fileName = createNameByUrl(url);
  const filePath = path.join(directory, fileName);

  return loadPage(url)
    .then((data) => saveData(filePath, data))
    .then(() => filePath);
}

export { saveData, loadPage };
export default savePrimaryPage;
