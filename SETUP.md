# 配置指南

## 飞书 Webhook 配置

### 1. 创建飞书群组
1. 打开飞书 APP
2. 创建新群组（可以只包含你自己）
3. 群名如 "Claude Code 通知"

### 2. 添加自定义机器人
1. 群设置 → 群机器人 → 添加机器人
2. 选择"自定义机器人" → 添加
3. 设置名称（如：Claude Code 助手）
4. 复制 webhook 地址

### 3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env，填入 webhook 地址
```

或运行配置向导：
```bash
node setup-wizard.js
```

### 4. 测试
```bash
node notify-system.js --message "测试手环震动"
```

手机收到飞书通知 + 手环震动 = 配置成功。

## Claude Code Hooks 配置

编辑 `~/.claude/settings.json`：

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node /path/to/ccdd/notify-system.js" }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          { "type": "command", "command": "node /path/to/ccdd/notify-system.js" }
        ]
      }
    ]
  }
}
```

将 `/path/to/ccdd` 替换为实际路径。

### 事件说明

| 事件 | 触发时机 | 通知内容 |
|------|---------|---------|
| `Stop` | 任务完成/停止 | 自动提取最后一条用户消息作为摘要 |
| `Notification` | 权限请求/等待输入/MCP 需要信息 | 显示具体请求内容 |

## 终端名识别

### tmux（推荐）
在 tmux 里运行 Claude Code，窗口名自动读取：
```bash
tmux new -s work -n "feature-x"
# 通知会显示: "feature-x，任务完成"
```

改名：`Ctrl+B ,` 或 `tmux rename-window "新名字"`

### iTerm2 / Terminal.app
自动通过 AppleScript 读取标签名。

### 手动设置
```bash
export TERMINAL_NAME="my-session"
```

## 故障排除

### 飞书通知不生效
1. 检查 `.env` 中 webhook 地址是否正确
2. 运行 `node feishu-notify.js --message "测试"` 单独测试
3. 检查网络连接

### 声音不播放
1. macOS：检查系统音量，确认 `/System/Library/Sounds/Glass.aiff` 存在
2. Windows：检查 PowerShell 是否可用
3. 其他：只支持 terminal bell

### 手环不震动
1. 检查手环与手机蓝牙连接
2. 检查飞书 APP 通知权限
3. 检查手环 APP 通知权限
4. 确保飞书未设为免打扰
