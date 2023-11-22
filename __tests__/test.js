
import path from 'path';
import nock from 'nock';
import fs from 'fs';
import os from 'os';
import savePage from '../src/index.js';

nock.disableNetConnect();

let directoryPath;

beforeEach(async () => {
    directoryPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('file content filling test', async () => {
    const request = nock('https://ru.hexlet.io')
        .get('/courses')
        .reply(200, '<html><head></head><body>some text ABC</body></html>');

    const filePath = await savePage(directoryPath, 'https://ru.hexlet.io/courses');

    expect(request.isDone()).toBe(true);
    expect(await fs.promises.readFile(filePath, 'utf-8')).toBe('<html><head></head><body>some text ABC</body></html>');
});

test('sources crawling test', async () => {
    const originalStdout = process.stdout.write;
    process.stdout.write = () => { };
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
    process.stdout.write = originalStdout
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

describe('Error handling tests', () => {
    test('no response ', async () => {
        const invalidBaseUrl = 'https://ru.hexlet.io';
        const expectedError = `getaddrinfo ENOTFOUND ${invalidBaseUrl}`;
        nock(invalidBaseUrl).persist().get('/').replyWithError(expectedError);
        await expect(savePage(directoryPath, 'https://ru.hexlet.io/'))
            .rejects.toThrow(/ENOTFOUND/);
    });
    test('dir existance error handling', async () => {
        const fakeDir = path.join(directoryPath, 'fakeDir/dirName');
        nock('https://ru.hexlet.io')
            .get('/courses')
            .reply(200, 'some data');
        await expect(savePage(fakeDir, 'https://ru.hexlet.io/courses')).rejects.toThrow(/ENOENT/);
    });
})


afterEach(async () => {
    await fs.promises.rm(directoryPath, { recursive: true });
});