
import path from 'path';
import nock from 'nock';
import fs from 'fs';
import os from 'os';
import savePage, { crawlAndSaveContent } from '../src/saveAndCrawlData.js';

nock.disableNetConnect();

let directoryPath;

beforeEach(async () => {
    directoryPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('file content filling test', async () => {
    const request = nock('https://ru.hexlet.io')
        .get('/courses')
        .reply(200, 'some text ABC');

    const filePath = path.join(directoryPath, 'ru-hexlet-io-courses.html');
    await crawlAndSaveContent(directoryPath, 'https://ru.hexlet.io/courses');

    expect(request.isDone()).toBe(true);
    expect(await fs.promises.readFile(filePath, 'utf-8')).toBe('some text ABC');
});

test('sources crawling test', async () => {
    const mainFilePathBefore = './__fixtures__/sourcesTestMainPageBefore.html';
    const mainFilePathAfter = './__fixtures__/sourcesTestMainPageAfter.html';
    const mainPageDataBefore = await fs.promises.readFile(mainFilePathBefore, 'utf-8');
    const mainPageDataAfter = await fs.promises.readFile(mainFilePathAfter, 'utf-8');
    nock('https://ru.hexlet.io')
        .get('/courses')
        .reply(200, mainPageDataBefore);
    await savePage(directoryPath, 'https://ru.hexlet.io/courses');

    const filePath = path.join(directoryPath, 'ru-hexlet-io-courses.html');
    expect((await fs.promises.readFile(filePath, 'utf-8')).replace(/(\n| )/g, '')).toBe(mainPageDataAfter.replace(/(\n| )/g, ''));

    const sourcesDirPath = path.join(directoryPath, 'ru-hexlet-io-courses_files');
    const sources = await fs.promises.readdir(sourcesDirPath);
    const allCrawledSourcesNames = [
        'ru-hexlet-io-assets-application.css',
        'ru-hexlet-io-assets-professions-nodejs.png',
        'ru-hexlet-io-courses.html',
        'ru-hexlet-io-packs-js-runtime.js'
    ]
    const callback = (elem) => sources.includes(elem);

    expect(allCrawledSourcesNames.every(callback)).toBe(true);
});

afterEach(async () => {
    await fs.promises.rm(directoryPath, { recursive: true });
});