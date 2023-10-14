import savePrimaryPage from './savePage.js';
import sourcesStep from './sourcesStep.js';
import { createDir } from './savePage.js';
import createNameByUrl from './createNameByUrl.js';
import path from 'path';

const savePage = (outputDir, mainPageUrl) => {
    return savePrimaryPage(outputDir, mainPageUrl, mainPageUrl, '')
        .then((mainFilePath) => sourcesStep(mainPageUrl, outputDir, mainFilePath))
}

export default savePage;