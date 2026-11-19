# 维护者发布清单

建议仓库名 `eni-markji-sync`；仓库简介：`考研英语一写作语料助手｜AI 制卡 + 安卓 HTTP 快捷方式 + 墨墨记忆卡｜单牌组八章节与荧光笔排版`。

## 首次发布

1. 下载公开版源码 ZIP，解压。检查 LICENSE 是否接受 MIT 许可、署名是否符合你的意愿；MIT 允许他人复制、修改、再分发和商用。截图仅用于教程，不将第三方商标或界面权利纳入许可承诺。
2. 在 GitHub 新建空 Public 仓库（如需先审查，可先 Private）。不要把真实备份、Token、私有版源码 ZIP 或完整快捷方式导出上传。上传解压后的文件和目录，**确保 README.md 在仓库根目录**。
3. GitHub 网页端可使用 Add file → Upload files；若手机网页无法批量上传完整目录，可用 GitHub 桌面版、Git CLI 或 Android Termux 的 Git。网页上传有大小和文件数限制，见 [官方说明](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)。不要只上传 ZIP，否则 GitHub 首页不会渲染 README。
4. 可选 Git 命令（在解压后的项目根目录，先在 GitHub 建空仓库）：

```sh
git init -b main
git add .
git commit -m "Initial public release: ENI Markji sync"
git remote add origin https://github.com/YOUR_USERNAME/eni-markji-sync.git
git push -u origin main
```

5. 在仓库 Releases 新建草稿 `v0.4.0`，附上公开版源码 ZIP、独立插件 ZIP 和离线图文教程 HTML（按需）。以新账号验证完整流程后再发布稳定版。未验证前可标为 pre-release。
6. 检查 Actions 测试状态，确认 GitHub README 的所有图片和相对链接正常。添加 Topics：`考研英语`、`markji`、`flashcards`、`android`、`chatgpt`、`spaced-repetition`。

## 推荐发布说明

**ENI 英一语料助手 v0.4.0 · 公开版预览**

- ChatGPT 生成 ENI-sync-v2，Android 本地确认写入；不需要云服务器。
- 一个私有牌组、八个章节，彩色排版、黄色荧光笔和中文主动回忆。
- 提供空库自检、同步去重、可选本地备份及标准旧卡美化。
- 无私人牌组 ID、Token、私人备份或个人错题。普通提示词可独立使用。
- 原个人版已真实验证主要工作流；本公共版已通过离线模拟测试，仍需新账号真实验证。

## 发布前最后检查

- [ ] 没有任何真实 Token、完整私人 JSON 或个人联系方式。
- [ ] 没有 `mkjd_` 后接实际私人 ID、`mkjch_`、`mkjc_` 或账号标识。
- [ ] `README.md` 首页正常，教程图文和示例文件可打开。
- [ ] Node 模拟测试通过；在新账号空私有牌组验证新增、重复和跨章。
- [ ] README 不声称后台自动写入或官方背书，不声称所有账号可安装插件。
- [ ] 确认 MIT 许可、署名和截图的公开使用范围。

开源源码与公开 ChatGPT 插件目录是两回事。这里仅提供 GitHub 源码发布，原有私人插件的可见性不会被修改。
