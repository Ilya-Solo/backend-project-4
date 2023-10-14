import path from 'path';
import fs from 'fs';
import createNameByUrl from './createNameByUrl.js';
import { createDir } from './savePage.js';
import { ImagesProcessor, LinksProcessor, ScriptsProcessor } from './sourcesWorkingClasses/sourcesProcessors.js';

const processorsArray = [ImagesProcessor, LinksProcessor, ScriptsProcessor];

const sourcesStep = (mainPageUrl, outputDir, mainFilePath) => {
    const filesDirName = createNameByUrl(mainPageUrl, mainPageUrl, '_files');
    const filesDirFullPath = path.join(outputDir, filesDirName);
    return createDir(filesDirFullPath)
        .then(() => processSource(mainPageUrl, filesDirFullPath, mainFilePath, ImagesProcessor))
        .then(() => processSource(mainPageUrl, filesDirFullPath, mainFilePath, LinksProcessor))
        .then(() => processSource(mainPageUrl, filesDirFullPath, mainFilePath, ScriptsProcessor))
}

const processSource = (mainPageUrl, filesDirFullPath, mainFilePath, sourceProcessorClass) => {
    return fs.promises.readFile(mainFilePath)
        .then((data) => {
            const sourceProcessor = new sourceProcessorClass(mainPageUrl, filesDirFullPath, mainFilePath, data);
            return sourceProcessor.sourcesProcessingPromise();
        })
}

export default sourcesStep;
// export default imagesProcessingStep;