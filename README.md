# Codex 账号切换工具 (cxs)

一个简单高效的 Codex 多账号配置切换工具，支持快速在不同中转平台间切换。

## 📋 功能特性

- 🔄 **快速切换**：在多个 Codex 配置间一键切换
- 🎯 **双重选择**：支持数字输入和箭头键选择两种方式
- 📊 **配置查看**：清晰显示当前使用的配置信息
- 🎨 **美观界面**：彩色终端界面，层次分明
- ⚡ **零配置**：读取现有配置文件，无需额外设置

## 🖥️ 系统要求

- **仅支持 macOS 平台**
- Node.js 14 或更高版本
- 现有的 Codex 配置文件

## 📦 安装

```bash
npm install -g codex-switch
```

安装完成后，`cxs` 命令将全局可用。

## 🚀 使用方法

### 配置账号

首先在 `~/.codex/apiConfig.json` 中配置你的账号信息：

```json
[
  {
    "name": "账号名称1",
    "OPENAI_API_KEY": "your-api-key-1",
    "config": {
      "model_providers": "provider1",
      "name": "账号名称1",
      "base_url": "https://api1.example.com/v1",
      "wire_api": "responses",
      "env_key": "provider1"
    }
  },
  {
    "name": "账号名称2",
    "OPENAI_API_KEY": "your-api-key-2",
    "config": {
      "model_providers": "provider2",
      "name": "账号名称2",
      "base_url": "https://api2.example.com/v1",
      "wire_api": "responses",
      "env_key": "provider2"
    }
  }
]
```

### 命令列表

#### 查看和切换账号
```bash
cxs list
```

显示所有可用账号，支持两种选择方式：
- **数字输入**：直接输入 1、2、3 等快速选择
- **箭头键选择**：使用上下键移动，回车确认
- **取消操作**：输入 0 或选择取消选项

#### 查看当前配置
```bash
cxs current
```

以 TOML 格式显示当前的配置信息，包括：
- API Key 信息 (来自 auth.json)
- 模型配置信息 (来自 config.toml)

#### 显示帮助
```bash
cxs help
```

显示所有可用命令和使用说明。

## 🎨 界面预览

### 账号选择界面
```
🎯 选择方式:
  • 输入数字 (1-2) 快速选择
  • 使用上下键移动并回车确认
  • 输入 0 取消操作

? 请选择要切换的账号:

  1) ● duck (当前) │ sk-xxxx...xxxx │ https://api1.example.com/v1
  2) ○ playcode │ sk-yyyy...yyyy │ https://api2.example.com/v1
     ────────────────────────────────────────
  3) ✖ 取消操作
```

### 当前配置显示
```
🔑 auth.json ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPENAI_API_KEY = "sk-your-actual-key"

⚙️  config.toml ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

model_provider = "your-provider"
model = "gpt-4"
model_reasoning_effort = "high"
disable_response_storage = true

[model_providers.your-provider]
name = "your-provider"
base_url = "https://api.example.com/v1"
wire_api = "responses"
env_key = "your-provider"
```

## 📁 文件说明

工具会自动管理以下配置文件：

- `~/.codex/apiConfig.json` - 账号配置文件（需手动创建）
- `~/.codex/auth.json` - API 密钥文件（自动更新）
- `~/.codex/config.toml` - Codex 配置文件（自动更新）

## ⚠️ 注意事项

1. **仅支持 macOS 平台**
2. 确保 `~/.codex/` 目录存在
3. 手动创建和维护 `apiConfig.json` 文件
4. 切换前请确保目标配置信息正确
5. 工具会保留现有配置文件格式，仅更新相关字段

## 🔧 项目信息

- **包名**：codex-switch
- **版本**：1.0.0
- **语言**：Node.js
- **依赖**：inquirer, chalk, @iarna/toml, fs-extra
- **许可**：ISC

## 📞 支持

如遇问题或需要帮助，请检查：
1. 是否已正确安装：`npm list -g codex-switch`
2. 配置文件格式是否正确
3. 文件权限是否足够
4. Node.js 版本是否满足要求

如需卸载：
```bash
npm uninstall -g codex-switch
```

---

**注意：此工具仅在 macOS 平台测试通过，不保证其他操作系统的兼容性。**