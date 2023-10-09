import savePrimaryPage from './savePage.js';
import processImages from './imagesProcessing/imagesProcessor.js';

const savePage = (outputDir, url) => {
    return savePrimaryPage(outputDir, url)
        .then((mainFilePath) => processImages(mainFilePath, url))
}

export default savePage;