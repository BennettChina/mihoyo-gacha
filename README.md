# miHoYo Gacha Analysis Plugin

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-%3E%3D16-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)
![Adachi-BOT](https://img.shields.io/badge/Adachi--BOT-v3.4+-orange.svg)
![Games](https://img.shields.io/badge/games-原神%20|%20星铁%20|%20绝区零-brightgreen.svg)

</div>

<h2 align="center">米哈游抽卡分析插件</h2>

## 🧑‍💻 简介

**miHoYo抽卡分析插件** 是一个基于 [Adachi-BOT](https://github.com/SilveryStar/Adachi-BOT)
的多游戏抽卡数据分析插件，专门用于分析米哈游旗下游戏的抽卡记录。该插件支持原神、崩坏：星穹铁道、绝区零三款游戏，提供完整的抽卡数据分析、可视化图表生成、数据导入导出等功能。

> [!IMPORTANT]
> 默认不会复制 [genshin_draw_analysis](https://github.com/wickedll/genshin_draw_analysis)
> 插件和 [sr_gacha_analysis](https://github.com/BennettChina/sr_gacha_analysis) 插件的数据，可通过修改配置文件中的
`migrate` 为 `true` 选项来实现数据迁移。

## ✨ 功能特性

- 🎮 **多游戏支持**：完整支持原神、星穹铁道、绝区零三款游戏
- 📊 **多种分析方式**：
    - 🔗 抽卡链接直接分析
    - 🍪 Cookie自动获取分析（原神、绝区零）
    - 📈 历史记录数据分析
- 📋 **数据标准化**：
    - 支持 [UIGF-v4.0](https://uigf.org/zh/standards/uigf.html) 标准（原神）
- 💾 **数据管理**：
    - JSON/Excel/URL 格式导入导出
    - 历史记录存储与管理
    - 数据删除与清理功能
- 📈 **可视化分析**：
    - 精美的图表分析
    - 详细的抽卡统计
    - 多样式图表展示
- ☁️ **云存储支持**：支持OSS云存储，便于数据分享

## 🎮 支持游戏

| 游戏   | 链接分析 | Cookie分析 | 历史记录 | 数据标准 |
|------|------|----------|------|------|
| 原神   | ✅    | ✅        | ✅    | UIGF |
| 星穹铁道 | ✅    | ❌        | ✅    | UIGF |
| 绝区零  | ✅    | ✅        | ✅    | UIGF |

## 🛠️ 安装方式

### 前置要求

- Node.js >= 16
- [Adachi-BOT](https://github.com/SilveryStar/Adachi-BOT) v3.4+
- [原神插件](https://github.com/MarryDream/adachi-genshin-plugin)
- [miHoYo登录插件](https://github.com/BennettChina/mihoyo-login)

### 安装步骤

在 `Adachi-BOT/src/plugins` 目录执行下面的命令：

```bash
git clone https://github.com/BennettChina/mihoyo-gacha.git
```

## 🎁 更新方式

### 💻 命令行更新

在插件目录执行下面的命令即可：

```bash
git pull
```

### 📱 指令更新

可使用 `#upgrade_plugins 抽卡分析` 指令来更新本插件。

## 🧰 指令列表

| 指令名     | 参数                  | 描述          | 示例                                     |
|---------|---------------------|-------------|----------------------------------------|
| `#分析抽卡` | `[游戏] (服务序号\|抽卡链接)` | 分析指定游戏的抽卡记录 | `#分析抽卡 原神 1`<br>`#分析抽卡 星铁 https://...` |
| `#分析记录` | `[游戏]`              | 使用历史数据生成分析图 | `#分析记录 原神`                             |
| `#导出记录` | `[游戏] [格式]`         | 导出抽卡记录      | `#导出记录 原神 json`                        |
| `#导入记录` | `[游戏] [格式]`         | 导入抽卡记录      | `#导入记录 原神 json`                        |
| `#清除记录` | `[游戏]`              | 清除指定游戏的记录   | `#清除记录 原神`                             |

### 参数说明

- **游戏**：`原神`、`星铁`、`绝区零`
- **服务序号**：私人服务的Cookie序号（1、2、3...）
- **格式**：`json`、`excel`、`url`
- **抽卡链接**：游戏内获取的抽卡历史链接

## ⚙️ 配置文件

插件会自动生成配置文件 `config/mihoyo-gacha.yml`，主要配置项：

```yaml
# OSS云存储配置（可选）
s3:
    enable: false          # 是否启用OSS
    accessKey: ""         # OSS访问密钥
    secretKey: ""         # OSS密钥
    bucket: ""            # 存储桶名称
    domain: ""            # OSS域名
    folder: ""            # 文件夹路径
    endpoint: ""          # OSS端点
    region: ""            # OSS区域

# 其他配置
qrcode: false           # 是否显示二维码
aliases: [ "抽卡分析" ]    # 插件别名
```

## 📖 使用教程

### 1. 获取抽卡链接

#### 原神

PC 端参考 [链接获取教程](https://feixiaoqiu.com/rank_url_upload_init/)，使用脚本获取日志中的链接，移动端需要抓包建议使用
Cookie 方式。

#### 星穹铁道

通过云·星穹铁道打开游戏后打开游戏的抽卡记录界面，然后将以下 JavaScript 脚本添加至书签中，并在抽卡记录界面点击该书签即可。

```javascript
javascript:(function () {
    var iframe = document.querySelector('iframe');
    if (iframe) {
        window.prompt('请全选并复制抽卡链接：', iframe.src);
    } else {
        alert('没有找到抽卡链接，请点击跃迁里的查看详情！');
    }
})();
```

#### 绝区零

PC 端参考 [链接获取教程](https://feixiaoqiu.com/rank_url_upload_init/)，使用脚本获取日志中的链接，移动端需要抓包建议使用
Cookie 方式。

### 2. Cookie获取方式

1. 可使用 [mihoyo-login](https://github.com/BennettChina/mihoyo-login) 插件获取
2. 参考 [胡桃工具箱](https://hut.ao/zh/advanced/get-stoken-cookie-from-the-third-party.html) 中的获取方式

### 3. 使用示例

使用 Cookie 分析抽卡记录需要先通过「原神」插件中的 `#pr` 指令绑定私人服务，然后使用 `#分析抽卡` 指令即可。

```text
# 使用链接分析原神抽卡
#分析抽卡 原神 https://hk4e-api.mihoyo.com/event/gacha_info/api/...

# 使用Cookie分析（私人服务1号）
#分析抽卡 原神 1

# 查看历史记录
#分析记录 原神

# 导出数据
#导出记录 原神 json

# 导入数据
#导入记录 原神 json https://example.com/abc.json
```

## ❓ 常见问题

### Q: 为什么星铁不支持Cookie分析？

A: 星铁的API接口与原神不同，目前仅支持链接方式分析。

### Q: 导出的数据可以在其他工具中使用吗？

A: 可以，本插件严格遵循 UIGF-v4.0标准，数据可在支持相同标准的工具间互通。

### Q: 如何删除其他UID的数据？

A: 为防止误删，需要先使用该UID重新分析一次，然后使用清除记录指令。

## 🤝 贡献指南

欢迎提交Issue和Pull Request来帮助改进这个项目！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Adachi-BOT](https://github.com/SilveryStar/Adachi-BOT) - 优秀的Bot框架
- [UIGF组织](https://uigf.org/) - 统一可交换抽卡记录标准
- 所有贡献者和用户的支持

## 📞 联系方式

- 作者：BennettChina
- 仓库：[mihoyo-gacha](https://github.com/BennettChina/mihoyo-gacha)
- 问题反馈：[Issues](https://github.com/BennettChina/mihoyo-gacha/issues)

---

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐**

</div>
