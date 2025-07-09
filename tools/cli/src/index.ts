import { Command } from 'commander'
import chalk from 'chalk'

import { createProject } from './create'

const program = new Command()

program
  .name('create-linch-kit')
  .description('Create LinchKit apps instantly - AI-First 全栈开发框架脚手架')
  .version('1.0.2')
  .argument('[project-name]', 'project name')
  .option('-t, --template <template>', 'project template', 'default')
  .option('--no-install', 'skip installing dependencies')
  .option('--no-git', 'skip git initialization')
  .action(async (projectName, options) => {
    try {
      await createProject(projectName, options)
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

program.parse()
