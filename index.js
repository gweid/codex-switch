#!/usr/bin/env node

const path = require('path');
const os = require('os');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ConfigManager = require('./lib/config-manager');
const FileUtils = require('./lib/file-utils');

class CodexSwitch {
    constructor() {
        this.configManager = new ConfigManager();
        this.fileUtils = new FileUtils();
        this.codexDir = path.join(os.homedir(), '.codex');
    }

    async run() {
        try {
            console.log(chalk.cyan('🔄 Codex 账号切换工具'));
            console.log(chalk.gray('正在读取配置...'));

            // 读取配置文件
            const accounts = await this.configManager.loadApiConfig(this.codexDir);

            if (!accounts || accounts.length === 0) {
                console.log(chalk.red('❌ 未找到配置文件或配置为空'));
                console.log(chalk.yellow('请确保 ~/.codex/apiConfig.json 文件存在且包含有效配置'));
                return;
            }

            // 显示账号选择列表
            const selectedAccount = await this.selectAccount(accounts);

            if (!selectedAccount) {
                console.log(chalk.yellow('操作已取消'));
                return;
            }

            // 更新配置文件
            await this.updateConfigs(selectedAccount);

            console.log(chalk.green('✅ 配置切换成功！'));
            console.log(chalk.cyan(`当前使用账号: ${selectedAccount.name}`));

        } catch (error) {
            console.error(chalk.red('❌ 执行出错:'), error.message);
            process.exit(1);
        }
    }

    async selectAccount(accounts) {
        const choices = accounts.map(account => ({
            name: `${chalk.bold(account.name)} - ${account.config.base_url} - API Key: ${this.maskApiKey(account.OPENAI_API_KEY)}`,
            value: account
        }));

        const { selectedAccount } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedAccount',
                message: '请选择要使用的 Codex 账号:',
                choices: choices,
                pageSize: 10
            }
        ]);

        return selectedAccount;
    }

    async updateConfigs(account) {
        // 更新 auth.json
        await this.fileUtils.updateAuthFile(this.codexDir, account.OPENAI_API_KEY);

        // 更新 config.toml
        await this.fileUtils.updateConfigToml(this.codexDir, account.config);
    }

    maskApiKey(apiKey) {
        if (!apiKey || apiKey.length <= 8) {
            return '未设置';
        }
        return apiKey.substring(0, 4) + '*'.repeat(Math.max(4, apiKey.length - 8)) + apiKey.substring(apiKey.length - 4);
    }
}

module.exports = CodexSwitch;

// 如果直接运行此文件
if (require.main === module) {
    const app = new CodexSwitch();
    app.run();
}