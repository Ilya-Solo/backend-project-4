import * as cheerio from 'cheerio';
import createNameByUrl from '../createNameByUrl.js'
import path from 'path';
import fs from 'fs';

const extractImagesUrls = (data) => {
    const $ = cheerio.load(data);
    const imageUrls = [];
    $('img').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
            imageUrls.push(src);
        }
    });
    return images;
};

const imagesStep = (path) => {
    fs.promises.readFile(path, 'utf-8')
        .then((data) => {
            const imagesUrls = extractImagesUrls(data);
        })
}

// path -> data ->
//     [extract urls + load images + save images, change_urls_in_html + save result]
