
import path from 'path';
import nock from 'nock';
import fs from 'fs';
import os from 'os';
import savePage, { crawlAndSaveContent, saveContent, createDir, crawlContent } from '../src/saveAndCrawlData.js';
import jest from 'jest';

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
    const allSourcesUrls = [
        '/assets/application.css',
        '/assets/professions/nodejs.png',
        '/packs/js/runtime.js',
    ]
    allSourcesUrls.forEach((url) => {
        nock('https://ru.hexlet.io')
            .get(url)
            .reply(200, '');
    })
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
        'ru-hexlet-io-packs-js-runtime.js'
    ]
    const callback = (elem) => sources.includes(elem);

    expect(allCrawledSourcesNames.every(callback)).toBe(true);
});
describe('errors handling test', () => {
    test('createDir Test', async () => {
        // const fakeDir = path.join(directoryPath, 'fakeDir/dirName')

        // expect.assertions(1);
        // try {
        //     await createDir(fakeDir);
        // } catch (e) {
        //     console.log('das');
        //     expect(e).toMatch('error');
        // }
    })

    test('axios error handling test', async () => {
        // nock('https://ru.hexlet.io')
        //     .get('/courses')
        //     .reply(404);
        // // const a = crawlAndSaveContent(directoryPath, 'https://ru.hexlet.io/courses')
        // expect(() => { throw Error('') }).toThrow();
    })

    test('fs error handling test', async () => {

    })
})

afterEach(async () => {
    await fs.promises.rm(directoryPath, { recursive: true });
});