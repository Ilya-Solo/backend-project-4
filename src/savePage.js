import axios from 'axios';
import fs from 'fs';
import path from 'path'

const createFilenameByUrl = (url_string) => {
  const url = new URL(url_string);
  const urlNameWithoutProtocol = `${url.hostname}${url.pathname}`;

  const fileName = urlNameWithoutProtocol
    .replace(/\.html$/i, '')
    .replace(/[^A-Za-z0-9]/g, '-');

  return `${fileName}.html`;
};

const savePage = (directory, url, loadFunction) => {
  const fileName = createFilenameByUrl(url);
  const filePath = path.join(directory, fileName);
  return fs.promises //saving data into file using promise
    .open(filePath, 'w')
    .then((fileHandle) => {
      return loadFunction(url)
        .then(data => fileHandle.writeFile(data, 'utf-8'))
        .then(() => fileHandle.close())
        .then(() => filePath);
    })
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

export { savePage, loadPage };
