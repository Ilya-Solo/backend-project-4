import HtmlProcessor from './htmlProcessor.js';

const isLocalSource = (sourceUrl, mainPageUrl) => {
    try {
        const mainPageUrlObject = new URL(mainPageUrl);
        const sourceUrlObject = new URL(sourceUrl, mainPageUrlObject.origin);

        if (sourceUrlObject.hostname = mainPageUrlObject.hostname) {
            return true;
        }

        return false;
    } catch {
        return false;
    }
}
class ImagesProcessor extends HtmlProcessor {
    constructor(mainPageUrl, outputDir, mainFilePath, data) {
        super(mainPageUrl, outputDir, mainFilePath, data);
        this.conditionVariables = [];
        this.condition = (() => true);
        this.attribute = 'src';
        this.elementName = 'img';
        this.crawlingOptions = { responseType: 'arraybuffer' };
    }
}

class LinksProcessor extends HtmlProcessor {
    constructor(mainPageUrl, outputDir, mainFilePath, data) {
        super(mainPageUrl, outputDir, mainFilePath, data);
        this.conditionVariables = this.mainPageUrl;
        this.condition = isLocalSource;
        this.attribute = 'href';
        this.elementName = 'link';
    }
}

class ScriptsProcessor extends HtmlProcessor {
    constructor(mainPageUrl, outputDir, mainFilePath, data) {
        super(mainPageUrl, outputDir, mainFilePath, data);
        this.conditionVariables = this.mainPageUrl;
        this.condition = isLocalSource;
        this.attribute = 'src';
        this.elementName = 'script';
    }
}

export { ImagesProcessor, LinksProcessor, ScriptsProcessor };