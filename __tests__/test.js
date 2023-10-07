
import path from 'path';
import nock from 'nock';
import fs from 'fs';
import os from 'os';
import { savePage, loadPage } from '../src/savePage.js';

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
    await savePage(directoryPath, 'https://ru.hexlet.io/courses', loadPage);

    expect(request.isDone()).toBe(true);
    expect(await fs.promises.readFile(filePath, 'utf-8')).toBe('some text ABC');
});

afterEach(async () => {
    await fs.promises.rm(directoryPath, { recursive: true });
});