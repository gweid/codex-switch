const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class ConfigManager {
    constructor() {
        this.configFileName = 'apiConfig.json';
    }

    /**
     * 加载 API 配置文件
     * @param {string} codexDir ~/.codex 目录路径
     * @returns {Array} 配置数组
     */
    async loadApiConfig(codexDir) {
        const configPath = path.join(codexDir, this.configFileName);

        try {
            // 检查配置文件是否存在
            const exists = await fs.pathExists(configPath);
            if (!exists) {
                throw new Error(`配置文件不存在: ${configPath}`);
            }

            // 读取配置文件
            const configContent = await fs.readJson(configPath);

            // 验证配置格式
            if (!Array.isArray(configContent)) {
                throw new Error('配置文件格式错误：应该是一个数组');
            }

            // 验证每个配置项
            const validatedConfigs = this.validateConfigs(configContent);

            console.log(chalk.green(`✅ 成功加载 ${validatedConfigs.length} 个配置账号`));
            return validatedConfigs;

        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`配置文件不存在: ${configPath}\\n请确保文件存在且格式正确`);
            }
            if (error.name === 'SyntaxError') {
                throw new Error(`配置文件 JSON 格式错误: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * 验证配置项格式
     * @param {Array} configs 配置数组
     * @returns {Array} 验证后的配置数组
     */
    validateConfigs(configs) {
        const validatedConfigs = [];

        configs.forEach((config, index) => {
            try {
                this.validateSingleConfig(config, index);
                validatedConfigs.push(config);
            } catch (error) {
                console.warn(chalk.yellow(`⚠️  跳过配置项 ${index + 1}: ${error.message}`));
            }
        });

        if (validatedConfigs.length === 0) {
            throw new Error('没有有效的配置项');
        }

        return validatedConfigs;
    }

    /**
     * 验证单个配置项
     * @param {Object} config 配置对象
     * @param {number} index 配置索引
     */
    validateSingleConfig(config, index) {
        if (!config || typeof config !== 'object') {
            throw new Error(`配置项 ${index + 1} 不是有效的对象`);
        }

        // 验证必需字段
        if (!config.name || typeof config.name !== 'string') {
            throw new Error(`配置项 ${index + 1} 缺少有效的 name 字段`);
        }

        if (!config.config || typeof config.config !== 'object') {
            throw new Error(`配置项 ${index + 1} 缺少有效的 config 字段`);
        }

        if (typeof config.OPENAI_API_KEY !== 'string') {
            throw new Error(`配置项 ${index + 1} OPENAI_API_KEY 必须是字符串`);
        }

        // 验证 config 字段的必需子字段
        const requiredConfigFields = [
            'model_providers',
            'name',
            'base_url',
            'wire_api',
            'env_key'
        ];

        for (const field of requiredConfigFields) {
            if (!config.config[field] || typeof config.config[field] !== 'string') {
                throw new Error(`配置项 ${index + 1} config.${field} 缺失或不是字符串`);
            }
        }

        // 验证 base_url 格式
        try {
            new URL(config.config.base_url);
        } catch {
            throw new Error(`配置项 ${index + 1} base_url 不是有效的 URL`);
        }
    }

    /**
     * 创建示例配置文件
     * @param {string} codexDir ~/.codex 目录路径
     */
    async createExampleConfig(codexDir) {
        const configPath = path.join(codexDir, this.configFileName);
        const exampleConfig = [
            {
                "name": "duck",
                "config": {
                    "model_provider": "",
                    "model": "",
                    "model_reasoning_effort": "",
                    "disable_response_storage": true,
                    "model_providers": "duck",
                    "name": "duck",
                    "base_url": "https://jp.instcopilot-api.com/v1",
                    "wire_api": "responses",
                    "env_key": "duck"
                },
                "OPENAI_API_KEY": ""
            },
            {
                "name": "playcode",
                "config": {
                    "model_provider": "",
                    "model": "",
                    "model_reasoning_effort": "",
                    "disable_response_storage": true,
                    "model_providers": "playcode",
                    "name": "playcode",
                    "base_url": "https://playcode.com/v1",
                    "wire_api": "responses",
                    "env_key": "playcode"
                },
                "OPENAI_API_KEY": ""
            }
        ];

        await fs.ensureDir(codexDir);
        await fs.writeJson(configPath, exampleConfig, { spaces: 2 });

        console.log(chalk.green(`✅ 示例配置文件已创建: ${configPath}`));
        console.log(chalk.cyan('请编辑配置文件并填入正确的 API Key'));
    }
}

module.exports = ConfigManager;