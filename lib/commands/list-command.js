const path = require('path');
const os = require('os');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const toml = require('@iarna/toml');
const ConfigManager = require('../config-manager');
const FileUtils = require('../file-utils');

class ListCommand {
    constructor() {
        this.configManager = new ConfigManager();
        this.fileUtils = new FileUtils();
        this.codexDir = path.join(os.homedir(), '.codex');
    }

    async execute() {
        try {
            this.printHeader();

            // 读取配置文件
            const accounts = await this.configManager.loadApiConfig(this.codexDir);

            if (!accounts || accounts.length === 0) {
                this.printNoAccountsError();
                return;
            }

            // 获取当前配置
            const currentAccount = await this.getCurrentAccount(accounts);

            // 选择账号（支持数字输入和上下键选择）
            const selectedAccount = await this.selectAccount(accounts, currentAccount);

            if (!selectedAccount) {
                console.log(chalk.yellow('\n💫 操作已取消'));
                return;
            }

            // 检查是否选择了相同账号
            if (currentAccount && selectedAccount.name === currentAccount.name) {
                console.log(chalk.blue('\n🎯 已经是当前账号，无需切换'));
                return;
            }

            // 更新配置文件
            await this.updateConfigs(selectedAccount);

            this.printSuccess(selectedAccount);

        } catch (error) {
            console.error(chalk.red('\n❌ 执行出错:'), error.message);
            throw error;
        }
    }

    printHeader() {
        console.log(chalk.cyan.bold('\n╭─────────────────────────────────────────╮'));
        console.log(chalk.cyan.bold('│          🔄 Codex 账号切换工具          │'));
        console.log(chalk.cyan.bold('╰─────────────────────────────────────────╯'));
        console.log(chalk.gray('正在读取配置...'));
    }

    printNoAccountsError() {
        console.log(chalk.red('\n❌ 未找到配置文件或配置为空'));
        console.log(chalk.yellow('请确保 ~/.codex/apiConfig.json 文件存在且包含有效配置'));
        console.log(chalk.gray('提示: 使用 cxs help 查看更多信息'));
    }

    async getCurrentAccount(accounts) {
        try {
            // 读取当前 auth.json
            const authPath = path.join(this.codexDir, 'auth.json');
            if (await fs.pathExists(authPath)) {
                const authConfig = await fs.readJson(authPath);
                if (authConfig.OPENAI_API_KEY) {
                    return accounts.find(account =>
                        account.OPENAI_API_KEY === authConfig.OPENAI_API_KEY
                    );
                }
            }
        } catch (error) {
            // 忽略错误，返回 null
        }
        return null;
    }



    async selectAccount(accounts, currentAccount) {
        console.log(chalk.blue('\n🎯 选择方式:'));
        console.log(chalk.gray('  • 输入数字 (1-' + accounts.length + ') 快速选择'));
        console.log(chalk.gray('  • 使用上下键移动并回车确认'));
        console.log(chalk.gray('  • 输入 0 取消操作\n'));

        // 构建选择列表
        const choices = accounts.map((account, index) => {
            const isCurrent = currentAccount && account.name === currentAccount.name;

            // 图标和名称
            const icon = isCurrent ? chalk.green('●') : chalk.gray('○');
            const accountName = chalk.bold(account.name);
            const currentTag = isCurrent ? chalk.green.dim(' (当前)') : '';

            // API Key 和 URL
            const apiKey = chalk.yellow(account.OPENAI_API_KEY || '未设置');
            const url = chalk.cyan(account.config.base_url || '未设置');

            return `${icon} ${accountName}${currentTag} ${chalk.gray('│')} ${apiKey} ${chalk.gray('│')} ${url}`;
        });

        // 添加分隔线和取消选项
        choices.push(
            new inquirer.Separator(chalk.gray('   ────────────────────────────────────────')),
            `${chalk.red('✖')} ${chalk.gray('取消操作')}`
        );

        const { selectedIndex } = await inquirer.prompt([
            {
                type: 'rawlist',
                name: 'selectedIndex',
                message: '请选择要切换的账号:\n',
                choices: choices,
                pageSize: Math.min(15, choices.length)
            }
        ]);

        // 计算实际选择的账号索引
        // accounts数量 + 取消选项(1) = total (Separator不占序号)
        const cancelOptionIndex = accounts.length + 1;

        // 如果选择了取消选项
        if (selectedIndex === cancelOptionIndex) {
            return null;
        }

        // 如果选择的是账号（1 到 accounts.length）
        if (selectedIndex <= accounts.length) {
            return accounts[selectedIndex - 1];
        }

        // 其他情况也返回 null（安全处理）
        return null;
    }


    async updateConfigs(account) {
        console.log(chalk.gray('\n⏳ 正在更新配置文件...'));

        // 更新 auth.json
        await this.fileUtils.updateAuthFile(this.codexDir, account.OPENAI_API_KEY);

        // 更新 config.toml
        await this.fileUtils.updateConfigToml(this.codexDir, account.config);
    }

    printSuccess(account) {
        console.log(chalk.green('\n╭─────────────────────────────────────────╮'));
        console.log(chalk.green('│              ✅ 切换成功!              │'));
        console.log(chalk.green('╰─────────────────────────────────────────╯'));
        console.log(chalk.cyan(`\n🎯 当前使用账号: ${chalk.bold(account.name)}`));
        console.log(chalk.gray(`🔑 API Key: ${chalk.yellow(account.OPENAI_API_KEY || '未设置')}`));
        console.log(chalk.gray(`🌐 Base URL: ${chalk.cyan(account.config.base_url || '未设置')}`));
        console.log(chalk.blue('\n💡 提示: 使用 cxs current 查看详细配置信息'));
    }
}

module.exports = ListCommand;