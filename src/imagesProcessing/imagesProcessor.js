import fs from 'fs';
import saveImages from './saveImages.js';
import saveDataWithChangedUrls from './changeImagesUrls.js';

const processImages = (path, url) => {
    fs.promises.readFile(path, 'utf-8')
        .then((data) => {
            const imagesSavingPromise = saveImages(path, url, data);
            const changeHtmlPromise = saveDataWithChangedUrls(path, url, data);
            return [imagesSavingPromise, changeHtmlPromise];
        })
}

export default processImages;