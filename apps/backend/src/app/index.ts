#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

import { engine } from './compositionRoot.js';
import { startCommand } from '../server/startCommand.js';

const program = new Command();

program.version(packageJson.version);

program
  .command('start')
  .description('Start backend server and frontend dev server')
  .option('--backend-only', 'Start only the backend server', false)
  .action(async (options) => {
    await engine.graphVerification.run(false);
    await startCommand({ backendOnly: options.backendOnly });
  });

program
  .command('verify')
  .description(
    'Verify whether the use cases found in child directories adhere to Clean Architeccture'
  )
  .action(async () => {
    await engine.graphVerification.run(true);
  });

program
  .command('init [language]')
  .description('Create the template for a new CSC207 project')
  .action(async (language: string = 'java') => {
    await engine.initProject.run(language);

    if (engine.initProject.getOutputData()) {
      console.log(chalk.green('Your project has been initialized.'));
    } else {
      console.log(
        chalk.red(
          'An error occurred and your project has not been initialized.'
        )
      );
    }
  });

program
  .command('module_init [language]')
  .description(
    'Create the template for a new CSC207 project, packaged by module.'
  )
  .action(async (language: string = 'java') => {
    await engine.initModuleProject.run(language);

    if (engine.initModuleProject.getOutputData()) {
      console.log(
        chalk.green('Your project packaged by module has been initialized.')
      );
    } else {
      console.log(
        chalk.red(
          'An error occurred and your project packaged by module has not been initialized.'
        )
      );
    }
  });

program
  .command('usecase <name>')
  .description('Create the template for a new use case')
  .action(async (name: string) => {
    await engine.createUseCase.run(name);
  });

program
  .command('module_usecase <feature> <usecase>')
  .description('Add a new use case to a specified feature.')
  .action(async (feature: string, usecase: string) => {
    await engine.createModuleUseCase.run(feature, usecase);
  });

program
  .command('feature <feature>')
  .description('Add a new feature to the directory of features.')
  .action(async (feature: string) => {
    await engine.createFeature.run(feature);
  });

program
  .command('end')
  .description('Close the express server and clean the tempdir')
  .action(async () => {
    await engine.endProject.run();
  });

program.parse(process.argv);
