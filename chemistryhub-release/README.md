# Chemistry Hub

在线化学方程式查询与配平工具。本仓库仅发布可直接部署的静态产物，不包含开发源码或构建工具。

- 当前版本：**v10.6.5**
- 在线地址：https://demo.chemistryformulahub.cn/
- 部署方式：Cloudflare Workers 静态资源托管

## 功能

- 化学方程式查询与配平
- 按反应物、产物及组合条件搜索
- 氧化还原分析、离子方程式视图、沉淀与气体信息
- 物质资料与关联反应查询
- 搜索历史与收藏
- 浅色、深色、跟随系统主题
- 完整加载动画与轻量动效模式

历史、收藏和外观设置保存在当前域名下的浏览器本地存储中，不会自动跨浏览器或域名同步。

## 仓库结构

```text
.
├── dist/
│   ├── index.html
│   ├── advanced.html
│   ├── saved.html
│   ├── _headers
│   └── assets/
│       ├── css/
│       └── js/
├── wrangler.jsonc
├── .gitignore
└── README.md
```

`dist` 包含网站运行需要的页面、样式、脚本和数据。脚本已合并压缩及混淆，资源文件名包含内容哈希。

## 本地预览

如已安装 Python，在仓库根目录运行：

```powershell
python -m http.server 8899 --directory dist
```

打开 http://localhost:8899/ 。该服务器仅用于预览，不会应用 Cloudflare 的 `_headers` 响应头规则。不建议直接双击 HTML，以免本地存储或浏览器安全策略影响功能。

## 终端部署到 Cloudflare Workers

需要 Node.js 和 npm，不需要在仓库内安装 `node_modules`。

```powershell
npx --yes wrangler login
npx --yes wrangler deploy
```

配置中的 Worker 名称为 `chemistryhub`，静态资源目录为 `./dist`。发布到现有账户前，请确认目标 Worker 正确；部署可能覆盖该 Worker 的现有版本及配置。其他使用者应先修改 Worker 名称。

自定义域名应在 Cloudflare 控制台中绑定到对应 Worker。本仓库不包含账户 ID、API Token 或显式路由配置，不负责自动创建或迁移域名。

如果在 Cloudflare 控制台通过 GitHub 仓库配置 Workers Builds，可使用：

- 根目录：仓库根目录
- 构建命令：留空（这里是已经构建好的产物）
- 部署命令：`npx wrangler deploy`

不要使用 `wrangler pages deploy`：此配置用于 **Workers**，不是 Pages。

## 上传到 GitHub

在 GitHub 创建一个空仓库，然后上传本目录中的文件与 `dist` 文件夹，保留目录结构。确认隐藏文件 `.gitignore` 一并上传。

本目录已初始化本地 Git 仓库，但没有创建提交、绑定远程或推送。如通过 Git 命令上传，在此目录执行：

```powershell
git add README.md .gitignore wrangler.jsonc dist
git commit -m "发布 Chemistry Hub v10.6.5 静态产物"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

## 后续更新

本仓库无法重建源码。每次在开发项目中完成修改并构建后，应**整体替换**这里的 `dist`（移除旧哈希资源），同步更新本说明中的版本，再提交或部署。

不要将开发项目根目录、原始数据模块、构建脚本、Wrangler 登录配置或日志复制到公开仓库。提交前检查 `git status`，`.gitignore` 不能阻止已经被跟踪的敏感文件继续提交。

## 安全边界与使用提示

纯前端运行所需的 JS 和数据始终可由访问者获取。压缩、混淆只能提高阅读与逆向分析门槛，不等于加密或禁止复制。

查询和配平结果仅供学习参考；数学配平成功不代表反应在真实条件下一定发生。涉及实验时应依据可靠资料及专业安全指导。

本仓库未附带开源许可证；公开可见不等于授予修改、再分发或商业使用许可。如需使用，请联系项目维护者确认授权。
