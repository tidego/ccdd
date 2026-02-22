# CCDD — Claude Code 叮叮

Claude Code 任务完成通知系统。飞书推送 + macOS 音效 + 终端名识别，让你离开键盘也不会错过任务状态。

## 功能

- **飞书推送** — 任务完成/需要输入时发送飞书消息，手环震动提醒
- **macOS 系统音效** — 不同事件播放不同音效 (Glass/Sosumi/Tink/Ping/Pop) + 中文 TTS
- **终端名识别** — 自动读取 tmux 窗口名 / iTerm2 标签名，通知带上终端标识
- **智能摘要** — 自动提取最后一条用户消息作为任务描述
- **跨平台** — macOS (afplay+say) / Windows (PowerShell TTS) / 其他 (terminal bell)

## 快速开始

```bash
# 1. 克隆
git clone https://github.com/tidego/ccdd.git ~/.claude/ccdd
cd ~/.claude/ccdd
npm install

# 2. 配置飞书 webhook
cp .env.example .env
# 编辑 .env，填入你的 FEISHU_WEBHOOK_URL

# 3. 配置 Claude Code hooks — 编辑 ~/.claude/settings.json
```

在 `~/.claude/settings.json` 中添加：

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node ~/.claude/ccdd/notify-system.js" }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          { "type": "command", "command": "node ~/.claude/ccdd/notify-system.js" }
        ]
      }
    ]
  }
}
```

```bash
# 4. 测试
node notify-sound.js --event Stop        # 听到 Glass 音效 + "任务完成"
node notify-system.js --message "测试"    # 飞书 + 声音
```

## 终端名识别

通知会自动带上终端名前缀，方便区分多个会话。

| 方式 | 检测方法 | 示例通知 |
|------|---------|---------|
| **tmux** (推荐) | 自动读取 `tmux display-message -p '#W'` | `my-project，任务完成` |
| **iTerm2** | AppleScript 读取标签名 | `debug，任务完成` |
| **Terminal.app** | AppleScript 读取自定义标题 | `deploy，任务完成` |
| **环境变量** | `export TERMINAL_NAME="xxx"` | `xxx，任务完成` |

优先级：`TERMINAL_NAME` env > tmux > iTerm2/Terminal.app

## 事件 → 音效映射

| 事件 | 音效 | TTS 语音 |
|------|------|---------|
| Stop (任务完成) | Glass | 任务完成 |
| permission_prompt (权限请求) | Sosumi | 需要权限确认 |
| idle_prompt (等待输入) | Tink | 等待你的输入 |
| elicitation_dialog (需要信息) | Ping | 需要输入信息 |
| SubagentStop (子任务完成) | Pop | 子任务完成 |

## 项目结构

```
ccdd/
├── notify-system.js         # 主入口（hook 调用此文件）
├── notify-sound.js          # 音效模块（afplay/say/PowerShell/bell）
├── notification-manager.js  # 通知管理器
├── feishu-notify.js         # 飞书 webhook 模块
├── env-config.js            # 环境变量管理
├── setup-wizard.js          # 配置向导
├── config.json              # 配置文件
├── .env.example             # 环境变量模板
└── .env                     # 你的实际配置（gitignore）
```

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `FEISHU_WEBHOOK_URL` | 飞书机器人 webhook 地址 | 必填 |
| `NOTIFICATION_ENABLED` | 是否启用飞书通知 | `true` |
| `SOUND_ENABLED` | 是否启用声音提醒 | `true` |
| `TERMINAL_NAME` | 手动指定终端名（可选） | 自动检测 |

## 配置飞书 Webhook

1. 飞书中创建群组（可以只有你自己）
2. 群设置 → 群机器人 → 添加自定义机器人
3. 复制 webhook 地址到 `.env`

配好后，飞书消息会同步推送到手机，绑定的智能手环会震动提醒。

## 致谢

本项目基于 [崮生 (2234839)](https://github.com/2234839) 的 [ccdd](https://github.com/2234839/ccdd) 项目进行二次开发，在其飞书通知系统的基础上增加了 macOS 原生音效、终端名识别、跨平台支持等功能。感谢原作者的开源贡献！

## License

MIT
