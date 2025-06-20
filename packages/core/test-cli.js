#!/usr/bin/env node

console.log('Testing basic CLI functionality...')

const { Command } = require('commander')

const program = new Command()

program
  .name('linch-test')
  .description('Test CLI for Linch Kit')
  .version('0.1.0')

program
  .command('hello')
  .description('Say hello')
  .action(() => {
    console.log('Hello from Linch Kit!')
  })

program
  .command('version')
  .description('Show version')
  .action(() => {
    console.log('Linch Kit v0.1.0')
  })

// 如果没有参数，显示帮助
if (process.argv.length === 2) {
  program.outputHelp()
} else {
  program.parse()
}
