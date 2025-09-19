const path = require('path');
const os = require('os');
const chalk = require('chalk');
const fs = require('fs-extra');
const toml = require('@iarna/toml');
const ConfigManager = require('../config-manager');

class CurrentCommand {
    constructor() {
        this.configManager = new ConfigManager();
        this.codexDir = path.join(os.homedir(), '.codex');
    }

    async execute() {
        try {
            // 读取当前配置
            const currentConfig = await this.getCurrentConfig();

            if (!currentConfig.auth && !currentConfig.toml) {
                console.log(chalk.red('❌ 未找到配置文件'));
                console.log(chalk.yellow('请先使用 cxs list 选择一个账号配置'));
                return;
            }

            // 显示配置信息
            await this.displayConfig(currentConfig);

            // 尝试匹配到配置文件中的账号
            await this.matchAccountName(currentConfig);

        } catch (error) {
            console.error(chalk.red('❌ 读取配置失败:'), error.message);
            throw error;
        }
    }

    async getCurrentConfig() {
        const authPath = path.join(this.codexDir, 'auth.json');
        const configPath = path.join(this.codexDir, 'config.toml');

        const config = {
            auth: null,
            toml: null
        };

        // 读取 auth.json
        if (await fs.pathExists(authPath)) {
            try {
                config.auth = await fs.readJson(authPath);
            } catch (error) {
                console.warn(chalk.yellow('⚠️  无法读取 auth.json:'), error.message);
            }
        }

        // 读取 config.toml
        if (await fs.pathExists(configPath)) {
            try {
                const tomlContent = await fs.readFile(configPath, 'utf8');
                config.toml = toml.parse(tomlContent);
            } catch (error) {
                console.warn(chalk.yellow('⚠️  无法读取 config.toml:'), error.message);
            }
        }

        return config;
    }

    async displayConfig(currentConfig) {
        console.log(''); // 开头间隔

        // 显示 API Key
        if (currentConfig.auth && currentConfig.auth.OPENAI_API_KEY) {
            console.log(chalk.magenta.bold('🔑 auth.json ') + chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            console.log('');
            console.log(chalk.yellow(`OPENAI_API_KEY = "${currentConfig.auth.OPENAI_API_KEY}"`));
            console.log('');
            console.log('');
        }

        // 显示基础配置
        if (currentConfig.toml) {
            console.log(chalk.blueBright.bold('⚙️  config.toml ') + chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            console.log('');

            // 显示基础字段
            const basicFields = [
                'model_provider',
                'model',
                'model_reasoning_effort',
                'disable_response_storage'
            ];

            basicFields.forEach(field => {
                if (currentConfig.toml[field] !== undefined) {
                    const value = currentConfig.toml[field];
                    const displayValue = typeof value === 'string' ? `"${value}"` : value;
                    console.log(chalk.greenBright(`${field} = ${displayValue}`));
                }
            });

            // 显示 Provider 配置
            if (currentConfig.toml.model_providers) {
                console.log('');
                Object.entries(currentConfig.toml.model_providers).forEach(([providerName, providerConfig]) => {
                    console.log(chalk.cyanBright.bold(`[model_providers.${providerName}]`));

                    const providerFields = ['name', 'base_url', 'wire_api', 'env_key'];
                    providerFields.forEach(field => {
                        if (providerConfig[field] !== undefined) {
                            console.log(chalk.cyanBright(`${field} = "${providerConfig[field]}"`));
                        }
                    });
                });
            }
        }

        console.log(''); // 结束间隔
    }

    async matchAccountName(currentConfig) {
        // 此方法已保留但不显示输出，仅用于内部验证
        return;
    }

}

module.exports = CurrentCommand;