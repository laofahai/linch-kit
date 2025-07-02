import path from 'path'
import fs from 'fs-extra'
import degit from 'degit'
import chalk from 'chalk'
import ora from 'ora'
import prompts from 'prompts'
import { execSync } from 'child_process'

interface CreateOptions {
  template?: string
  install?: boolean
  git?: boolean
}

const TEMPLATE_REPO = 'laofahai/linch-kit/apps/starter'

export async function createProject(projectName?: string, options: CreateOptions = {}) {
  let targetDir = projectName

  // 如果没有提供项目名，询问用户
  if (!targetDir) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: '项目名称:',
      initial: 'my-linch-kit-app',
      validate: (name) => name.trim() ? true : '项目名称不能为空'
    })
    
    if (!response.projectName) {
      console.log(chalk.yellow('操作已取消'))
      process.exit(0)
    }
    
    targetDir = response.projectName.trim()
  }

  const targetPath = path.resolve(process.cwd(), targetDir)

  // 检查目录是否存在
  if (fs.existsSync(targetPath)) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `目录 ${chalk.cyan(targetDir)} 已存在，是否覆盖?`,
      initial: false
    })

    if (!overwrite) {
      console.log(chalk.yellow('操作已取消'))
      process.exit(0)
    }

    // 删除现有目录
    await fs.remove(targetPath)
  }

  console.log(`\\n正在创建项目 ${chalk.cyan(targetDir)}...\\n`)

  // 下载模板
  const spinner = ora('下载模板...').start()
  try {
    const emitter = degit(TEMPLATE_REPO, { cache: false, force: true })
    await emitter.clone(targetPath)
    spinner.succeed('模板下载完成')
  } catch (error) {
    spinner.fail('模板下载失败')
    throw new Error(`无法下载模板: ${error instanceof Error ? error.message : error}`)
  }

  // 更新 package.json
  await updatePackageJson(targetPath, targetDir)

  // 处理模板文件
  await processTemplateFiles(targetPath, targetDir)

  // 安装依赖
  if (options.install !== false) {
    await installDependencies(targetPath)
  }

  // 初始化 Git
  if (options.git !== false) {
    await initializeGit(targetPath)
  }

  // 完成提示
  printSuccessMessage(targetDir, options)
}

async function updatePackageJson(targetPath: string, projectName: string) {
  const packageJsonPath = path.join(targetPath, 'package.json')
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath)
    
    // 更新包信息
    packageJson.name = projectName
    packageJson.version = '0.1.0'
    packageJson.private = true
    packageJson.description = `${projectName} - LinchKit AI-First 全栈应用`
    
    // 将 workspace 依赖替换为 npm 发布版本
    const linchKitPackages = [
      '@linch-kit/core',
      '@linch-kit/schema', 
      '@linch-kit/auth',
      '@linch-kit/crud',
      '@linch-kit/trpc',
      '@linch-kit/ui'
    ]
    
    for (const pkg of linchKitPackages) {
      if (packageJson.dependencies?.[pkg]) {
        packageJson.dependencies[pkg] = '^1.0.2'
      }
    }
    
    // 移除 console 模块依赖（用户项目不需要）
    if (packageJson.dependencies?.['@linch-kit/console']) {
      delete packageJson.dependencies['@linch-kit/console']
    }
    
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
  }
}

async function processTemplateFiles(targetPath: string, projectName: string) {
  // 更新 README.md
  const readmePath = path.join(targetPath, 'README.md')
  if (fs.existsSync(readmePath)) {
    let readme = await fs.readFile(readmePath, 'utf-8')
    readme = readme.replace(/LinchKit Starter/g, projectName)
    readme = readme.replace(/@linch-kit\/starter/g, projectName)
    await fs.writeFile(readmePath, readme)
  }

  // 移除不需要的文件
  const filesToRemove = [
    'tsconfig.tsbuildinfo',
    'node_modules',
    '.next'
  ]

  for (const file of filesToRemove) {
    const filePath = path.join(targetPath, file)
    if (fs.existsSync(filePath)) {
      await fs.remove(filePath)
    }
  }
}

async function installDependencies(targetPath: string) {
  const spinner = ora('安装依赖...').start()
  
  try {
    // 检查是否有 pnpm
    let packageManager = 'npm'
    try {
      execSync('pnpm --version', { stdio: 'ignore' })
      packageManager = 'pnpm'
    } catch {
      try {
        execSync('yarn --version', { stdio: 'ignore' })
        packageManager = 'yarn'
      } catch {
        // 默认使用 npm
      }
    }

    execSync(`${packageManager} install`, {
      cwd: targetPath,
      stdio: 'ignore'
    })
    
    spinner.succeed(`依赖安装完成 (${packageManager})`)
  } catch (error) {
    spinner.fail('依赖安装失败')
    console.log(chalk.yellow('请手动运行 npm install 安装依赖'))
  }
}

async function initializeGit(targetPath: string) {
  try {
    execSync('git --version', { stdio: 'ignore' })
    execSync('git init', { cwd: targetPath, stdio: 'ignore' })
    execSync('git add .', { cwd: targetPath, stdio: 'ignore' })
    execSync('git commit -m "Initial commit from create-linch-kit"', { 
      cwd: targetPath, 
      stdio: 'ignore' 
    })
    console.log(chalk.green('✓ Git 仓库初始化完成'))
  } catch {
    console.log(chalk.yellow('Git 初始化跳过（未安装 Git 或初始化失败）'))
  }
}

function printSuccessMessage(projectName: string, options: CreateOptions) {
  console.log(`\\n${chalk.green('🎉 项目创建成功!')}\\n`)
  
  console.log(`进入项目目录：`)
  console.log(`  ${chalk.cyan(`cd ${projectName}`)}\\n`)
  
  if (options.install === false) {
    console.log('安装依赖：')
    console.log(`  ${chalk.cyan('npm install')} ${chalk.gray('# 或者')} ${chalk.cyan('pnpm install')}\\n`)
  }
  
  console.log('启动开发服务器：')
  console.log(`  ${chalk.cyan('npm run dev')} ${chalk.gray('# 或者')} ${chalk.cyan('pnpm dev')}\\n`)
  
  console.log('配置数据库：')
  console.log(`  ${chalk.cyan('npm run db:push')} ${chalk.gray('# 推送数据库结构')}`)
  console.log(`  ${chalk.cyan('npm run create-admin')} ${chalk.gray('# 创建管理员账户')}\\n`)
  
  console.log(`更多信息请查看: ${chalk.cyan('https://github.com/laofahai/linch-kit')}`)
  console.log(`\\n${chalk.dim('Happy coding! 🚀')}`)
}