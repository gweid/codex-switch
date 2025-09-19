const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const toml = require('@iarna/toml');

class FileUtils {
    constructor() {
        this.authFileName = 'auth.json';
        this.configFileName = 'config.toml';
    }

    /**
     * 更新 auth.json 文件 - 只更新 OPENAI_API_KEY 字段，保留其他字段
     * @param {string} codexDir ~/.codex 目录路径
     * @param {string} apiKey OpenAI API Key
     */
    async updateAuthFile(codexDir, apiKey) {
        const authPath = path.join(codexDir, this.authFileName);

        try {
            // 确保目录存在
            await fs.ensureDir(codexDir);

            // 读取现有配置（如果存在）
            let existingAuth = {};
            if (await fs.pathExists(authPath)) {
                try {
                    existingAuth = await fs.readJson(authPath);
                    console.log(chalk.gray('📖 读取现有 auth.json 配置'));
                } catch (parseError) {
                    console.warn(chalk.yellow(`⚠️  无法解析现有 auth.json，将创建新文件: ${parseError.message}`));
                    existingAuth = {};
                }
            } else {
                console.log(chalk.gray('📄 创建新的 auth.json 文件'));
            }

            // 只更新 OPENAI_API_KEY 字段，保留其他字段
            existingAuth.OPENAI_API_KEY = apiKey || "";

            await fs.writeJson(authPath, existingAuth, { spaces: 2 });
            console.log(chalk.green(`✅ 已更新 ${this.authFileName} 中的 OPENAI_API_KEY`));

        } catch (error) {
            throw new Error(`更新 auth.json 失败: ${error.message}`);
        }
    }

    /**
     * 更新 config.toml 文件 - 使用字符串替换保持原有格式
     * @param {string} codexDir ~/.codex 目录路径
     * @param {Object} config 配置对象
     */
    async updateConfigToml(codexDir, config) {
        const configPath = path.join(codexDir, this.configFileName);

        try {
            // 确保目录存在
            await fs.ensureDir(codexDir);

            let fileContent = '';
            let isNewFile = false;

            // 读取现有文件内容
            if (await fs.pathExists(configPath)) {
                fileContent = await fs.readFile(configPath, 'utf8');
                console.log(chalk.gray('📖 读取现有 config.toml 配置'));
            } else {
                console.log(chalk.gray('📄 创建新的 config.toml 文件'));
                isNewFile = true;
            }

            // 如果是新文件，创建基础结构
            if (isNewFile) {
                fileContent = this.createNewTomlContent(config);
            } else {
                // 更新现有文件的字段
                fileContent = this.updateExistingTomlContent(fileContent, config);
            }

            await fs.writeFile(configPath, fileContent, 'utf8');
            console.log(chalk.green(`✅ 已更新 ${this.configFileName} 中的指定字段`));

        } catch (error) {
            throw new Error(`更新 config.toml 失败: ${error.message}`);
        }
    }

    /**
     * 创建新的 TOML 文件内容
     * @param {Object} config 配置对象
     * @returns {string} TOML 内容
     */
    createNewTomlContent(config) {
        const lines = [];

        // 添加顶层配置
        lines.push(`model_provider = "${config.model_provider || ""}"`);
        lines.push(`model = "${config.model || ""}"`);
        lines.push(`model_reasoning_effort = "${config.model_reasoning_effort || ""}"`);
        lines.push(`disable_response_storage = ${config.disable_response_storage === true}`);
        lines.push('');

        // 添加 model_providers 配置
        if (config.model_providers) {
            lines.push(`[model_providers.${config.model_providers}]`);
            lines.push(`name = "${config.name || ""}"`);
            lines.push(`base_url = "${config.base_url || ""}"`);
            lines.push(`wire_api = "${config.wire_api || ""}"`);
            lines.push(`env_key = "${config.env_key || ""}"`);
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * 更新现有 TOML 文件内容 - 使用字符串替换
     * @param {string} content 原始内容
     * @param {Object} config 新配置
     * @returns {string} 更新后的内容
     */
    updateExistingTomlContent(content, config) {
        let updatedContent = content;

        // 1. 更新顶层字段
        const fieldsToUpdate = [
            { key: 'model_provider', value: config.model_provider },
            { key: 'model', value: config.model },
            { key: 'model_reasoning_effort', value: config.model_reasoning_effort },
            { key: 'disable_response_storage', value: config.disable_response_storage }
        ];

        fieldsToUpdate.forEach(({ key, value }) => {
            if (value !== undefined) {
                const regex = new RegExp(`^${key}\\s*=\\s*.*$`, 'm');
                const newLine = `${key} = ${typeof value === 'boolean' ? value : `"${value}"`}`;

                if (regex.test(updatedContent)) {
                    updatedContent = updatedContent.replace(regex, newLine);
                    console.log(chalk.gray(`  更新字段: ${key} = ${value}`));
                } else {
                    // 如果字段不存在，在文件开头添加（在第一个空行前）
                    const lines = updatedContent.split('\n');
                    let insertIndex = 0;

                    // 找到第一个空行或 section 开始的位置
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].trim() === '' || lines[i].startsWith('[')) {
                            insertIndex = i;
                            break;
                        }
                        if (i === lines.length - 1) {
                            insertIndex = lines.length;
                        }
                    }

                    lines.splice(insertIndex, 0, newLine);
                    updatedContent = lines.join('\n');
                    console.log(chalk.gray(`  添加字段: ${key} = ${value}`));
                }
            }
        });

        // 2. 处理 model_providers 部分
        if (config.model_providers) {
            updatedContent = this.updateModelProviders(updatedContent, config);
        }

        return updatedContent;
    }

    /**
     * 更新 model_providers 配置 - 替换现有的 provider 而非新增
     * @param {string} content 原始内容
     * @param {Object} config 新配置
     * @returns {string} 更新后的内容
     */
    updateModelProviders(content, config) {
        const newProviderKey = config.model_providers;

        // 构建新的 provider 配置
        const newProviderConfig = [
            `[model_providers.${newProviderKey}]`,
            `name = "${config.name || ""}"`,
            `base_url = "${config.base_url || ""}"`,
            `wire_api = "${config.wire_api || ""}"`,
            `env_key = "${config.env_key || ""}"`,
            '' // 在 env_key 后面添加空行
        ].join('\n');

        // 查找任何现有的 model_providers 配置（不管是什么名字）
        const anyProviderRegex = /\[model_providers\.[^\]]+\][\s\S]*?(?=\n\[(?!model_providers)|$)/;

        if (anyProviderRegex.test(content)) {
            // 替换现有的 provider 配置（不管原来的名字是什么）
            content = content.replace(anyProviderRegex, newProviderConfig);
            console.log(chalk.gray(`  替换现有 model_providers 配置为 ${newProviderKey}`));
        } else {
            // 如果没有任何 model_providers 配置，添加新的
            // 在第一个空行后添加新配置
            const lines = content.split('\n');
            let insertIndex = -1;

            // 找到第一个空行的位置
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim() === '') {
                    insertIndex = i + 1;
                    break;
                }
            }

            if (insertIndex > 0) {
                lines.splice(insertIndex, 0, '', ...newProviderConfig.split('\n'));
                content = lines.join('\n');
            } else {
                // 如果没有空行，在文件末尾添加
                if (!content.endsWith('\n\n')) {
                    content += '\n\n';
                }
                content += newProviderConfig + '\n';
            }
            console.log(chalk.gray(`  添加新的 model_providers.${newProviderKey} 配置`));
        }

        return content;
    }


    /**
     * 备份文件
     * @param {string} filePath 文件路径
     */
    async backupFile(filePath) {
        if (await fs.pathExists(filePath)) {
            const backupPath = `${filePath}.backup.${Date.now()}`;
            await fs.copy(filePath, backupPath);
            console.log(chalk.gray(`📁 已备份到: ${backupPath}`));
        }
    }

    /**
     * 验证文件路径和权限
     * @param {string} dirPath 目录路径
     */
    async validateDirectory(dirPath) {
        try {
            await fs.ensureDir(dirPath);

            // 检查读写权限
            await fs.access(dirPath, fs.constants.R_OK | fs.constants.W_OK);

        } catch (error) {
            if (error.code === 'EACCES') {
                throw new Error(`没有权限访问目录: ${dirPath}`);
            }
            throw error;
        }
    }

    /**
     * 创建示例配置文件
     * @param {string} codexDir ~/.codex 目录路径
     */
    async createExampleFiles(codexDir) {
        await this.validateDirectory(codexDir);

        // 创建示例 auth.json
        await this.updateAuthFile(codexDir, "your-api-key-here");

        // 创建示例 config.toml
        const exampleConfig = {
            model_provider: "",
            model: "gpt-4",
            model_reasoning_effort: "high",
            disable_response_storage: true,
            model_providers: "example",
            name: "example",
            base_url: "https://api.openai.com/v1",
            wire_api: "responses",
            env_key: "example"
        };

        await this.updateConfigToml(codexDir, exampleConfig);

        console.log(chalk.cyan(`📁 示例文件已创建在: ${codexDir}`));
    }
}

module.exports = FileUtils;