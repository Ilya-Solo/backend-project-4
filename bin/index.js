#!/usr/bin/env node

import { createRequire } from 'module';
import { program } from 'commander';
import savePage from '../src/index.js';

const require = createRequire(import.meta.url);
const packageConfig = require('../package.json');

const { version, description } = packageConfig;

program
    .version(version)
    .description(description)
    .arguments('<url>')
    .option('-o --output [dir]', 'output dir', process.cwd())
    .action((url) => {
        savePage(program.opts().output, url)
            .then((data) => console.log(`Page was successfully downloaded into '${data}'`));
    });

program.parse(process.argv);