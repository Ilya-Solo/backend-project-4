import savePrimaryPage from './savePage.js';
import imagesProcessingStep from './imagesStep.js';

const savePage = (outputDir, mainPageUrl) => {
    return savePrimaryPage(outputDir, mainPageUrl)
        .then((mainFilePath) => imagesProcessingStep(mainFilePath, outputDir, mainPageUrl))
}

export default savePage;