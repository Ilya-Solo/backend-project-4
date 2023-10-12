import * as cheerio from 'cheerio';
import path from 'path';
import crawlAndSaveData, { saveData } from '../savePage.js';
import createNameByUrl from '../createNameByUrl.js';

export default class HtmlProcessor {
    constructor(mainPageUrl, outputDir, mainFilePath, data) {
        this.outputDir = outputDir;
        this.data = data;
        this.mainFilePath = mainFilePath;
        this.mainPageUrl = mainPageUrl;
        this.crawlingOptions = {};
    }

    extractValuesFromElementsAttrs() {
        const $ = cheerio.load(this.data);
        const attrValues = [];
        $(this.elementName).each((_, element) => {
            const src = $(element).attr(this.attribute);
            if (src && this.condition(src, this.conditionVariables)) {
                attrValues.push(src);
            }
        });
        return attrValues;
    }

    saveSource(outputDir, sourceUrl) {
        return crawlAndSaveData(outputDir, sourceUrl, this.mainPageUrl, this.crawlingOptions);
    }

    saveSourcesPromise() {
        const crawlingPromises = extractValuesFromElementsAttrs(this.data)
            .map((sourceUrl) => this.saveSource(outputDir, sourceUrl));

        return Promise.all(crawlingPromises);
    }
    // ###################################
    changeAttrsValuesInData() {
        const $ = cheerio.load(data);
        const filesDirName = this.outputDir;
        $(this.elementName).each((_, element) => {
            const src = $(element).attr(this.attribute);
            if (src && this.condition(src, this.conditionVariables)) {
                const fullPath = path.join(filesDirName, createNameByUrl(src, this.mainPageUrl));
                $(element).attr(this.attribute, fullPath);
            }
        });

        return $.html();
    }

    saveChangedDataPromise() {
        const changedData = this.changeAttrsValuesInData();
        return saveData(this.mainFilePath, changedData);
    }

    sourcesProcessingPromise() {
        return Promise.all([this.saveChangedDataPromise(), this.saveSourcesPromise()]);
    }
}

