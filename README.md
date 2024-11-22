<div align="center">
    <h1>🚀 DeepLX Serverless</h1>
    <p>基于阿里云函数计算的 DeepL 免费翻译 API</p>
</div>

<div align="center">

![License](https://img.shields.io/github/license/lllgggrrr/deeplx-serverless)
![Node](https://img.shields.io/badge/Node.js-16+-green.svg)
![Platform](https://img.shields.io/badge/Platform-Aliyun_FC-orange.svg)

</div>

## ✨ 特性

- 🔄 基于原版 [DeepLX](https://github.com/OwO-Network/DeepLX) 项目使用 Node.js 重构
- 🛡️ 利用云函数动态 IP 特性，有效规避 API 限流
- ⚡ 部署简单，维护方便
- 💰 支持免费部署，适合个人使用
- 🔌 完全兼容沉浸式翻译插件

## 🚀 快速开始

### 前置要求

- 一个阿里云账号
- 一台可以操作的电脑或平板

### 部署步骤

#### 1️⃣ 创建服务

1. 登录[阿里云函数计算控制台](https://fcnext.console.aliyun.com/)
2. 点击【新建服务】
3. 服务名称填写：`translation-service`（可自定义）
4. 其他保持默认

#### 2️⃣ 创建函数

1. 在服务内点击【新建函数】
2. 选择【HTTP函数】模板
3. 配置以下参数：

   ```
   函数名称：deeplx（可自定义）
   运行环境：Node.js 16
   内存规格：128MB
   超时时间：60秒
   监听端口：1188
   启动命令：npm run start
   时区：Asia/Shanghai
   ```   

4. 上传代码：选择[本地 ZIP 包上传](https://github.com/lllgggrrr/deeplx-serverless/archive/refs/heads/main.zip)

#### 3️⃣ 触发器配置

    ```
    禁用公网访问 URL：否
    请求方法：POST
    认证方式：无认证
    ```

#### 4️⃣ 环境变量配置（可选）

在函数配置中可以设置以下环境变量：

| 环境变量 | 说明 | 默认值 | 是否必填 |
|---------|------|--------|----------|
| PORT | 服务运行端口 | 1188 | 否 |
| HOST | 服务监听地址 | 0.0.0.0 | 否 |
| TOKEN | API访问令牌 | - | 否 |

配置步骤：
1. 在函数详情页面，选择【函数配置】
2. 点击【编辑】按钮
3. 在【环境变量】区域添加所需变量
4. 点击【确定】保存更改

## 📝 使用方法

### API 调用示例

```bash
# 基础调用
curl -X POST '你的函数公网访问地址' \
-H 'Content-Type: application/json' \
-d '{
    "text": "你好，世界",
    "source_lang": "zh",
    "target_lang": "en"
}'
```

### TOKEN 认证方式（如果配置了 TOKEN）

```bash
# 方式1：URL参数方式
curl -X POST '你的函数公网访问地址?token=你的TOKEN' \
-H 'Content-Type: application/json' \
-d '{
    "text": "你好，世界",
    "source_lang": "zh",
    "target_lang": "en"
}'

# 方式2：请求头方式
curl -X POST '你的函数公网访问地址' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer 你的TOKEN' \
-d '{
    "text": "你好，世界",
    "source_lang": "zh",
    "target_lang": "en"
}'

# 方式3：DeepL 风格的认证头（同样支持）
curl -X POST '你的函数公网访问地址' \
-H 'Content-Type: application/json' \
-H 'DeepL-Auth-Key: 你的TOKEN' \
-d '{
    "text": "你好，世界",
    "source_lang": "zh",
    "target_lang": "en"
}'
```

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": "Hello, world.",
  "source_lang": "zh",
  "target_lang": "en",
  "alternatives": [
    "Hello, World.",
    "Hello, world!",
    "Hi, world."
  ]
}
```

## 🔧 沉浸式翻译配置

1. 安装[沉浸式翻译](https://github.com/immersive-translate/immersive-translate/releases)插件
2. 打开插件设置中的【开发者设置】
3. 启用【测试版实验功能】
4. 选择翻译服务：`DeepLX(beta)`
5. 填入你的函数公网访问地址
6. 如果设置了 TOKEN，在地址后面加上 `?token=你的TOKEN`

## 📚 Zotero 翻译插件配置

1. 安装 [Zotero PDF Translate](https://github.com/windingwind/zotero-pdf-translate/releases) 插件
2. 在 Zotero 中打开插件设置
3. 选择翻译服务：`DeepLX(API)`
4. 在 密钥 中 填入你的函数公网访问地址/translate（如果设置了 TOKEN，在地址后面加上 `?token=你的TOKEN`）

## 🖥️ 本地部署

```bash
git clone https://github.com/lllgggrrr/deeplx-serverless
cd deeplx-serverless
npm install
npm run start
```

## 📌 注意事项

- ⚠️ 建议开启函数日志便于问题排查
- 🔔 如遇到限流可以适当增加函数实例
- 💡 阿里云函数计算有免费额度，个人使用基本够用
- 🔐 如需添加访问控制，可配置 TOKEN 环境变量
- ⚙️ 本地部署时可通过环境变量自定义端口和监听地址

## 🙏 致谢

- [OwO-Network/DeepLX](https://github.com/OwO-Network/DeepLX) - 原始项目的灵感来源

## 📄 开源协议

本项目采用 MIT 协议开源，详见 [LICENSE](./LICENSE) 文件。