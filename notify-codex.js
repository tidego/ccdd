#!/usr/bin/env node
/**
 * Codex CLI 通知适配器
 *
 * Codex 的 notify hook 将 JSON 作为命令行参数传入（非 stdin）。
 *
 * 配置方法 — 在 ~/.codex/config.toml 中添加：
 *   notify = ["node", "/path/to/ccdd/notify-codex.js"]
 *
 * Codex 传入的 JSON 字段：
 *   type               — 事件类型，目前仅 "agent-turn-complete"
 *   thread-id          — 会话 ID
 *   turn-id            — 本轮 ID
 *   cwd                — 工作目录
 *   input-messages      — 用户消息数组
 *   last-assistant-message — 助手最后回复
 */

const path = require('path');
const { envConfig } = require('./env-config');
const { NotificationManager } = require('./notification-manager');
const { notifyTaskCompletion } = require('./notify-sound');
const fs = require('fs');

/**
 * 解析 Codex 传入的 JSON 参数
 */
function parseCodexArg() {
    const raw = process.argv[2];
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.log('⚠️  无法解析 Codex JSON 参数:', e.message);
        return null;
    }
}

/**
 * 从 Codex input-messages 提取任务摘要
 */
function extractCodexSummary(data) {
    if (!data) return null;

    // 从 input-messages 取最后一条用户消息
    const messages = data['input-messages'];
    if (Array.isArray(messages) && messages.length > 0) {
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const text = typeof msg === 'string'
                ? msg
                : (msg.content || msg.text || '');
            if (text) {
                const summary = text.slice(0, 100).replace(/\n/g, ' ').trim();
                return summary + (text.length > 100 ? '...' : '');
            }
        }
    }

    // fallback: last-assistant-message
    const lastMsg = data['last-assistant-message'];
    if (lastMsg) {
        const summary = lastMsg.slice(0, 80).replace(/\n/g, ' ').trim();
        return summary + (lastMsg.length > 80 ? '...' : '');
    }

    return null;
}

/**
 * 检测终端名称（复用 Claude Code 的逻辑）
 */
function getTerminalName() {
    const { execSync } = require('child_process');

    if (process.env.TERMINAL_NAME) return process.env.TERMINAL_NAME;

    if (process.env.TMUX) {
        try {
            const name = execSync('tmux display-message -p "#W"', {
                encoding: 'utf8', timeout: 2000, stdio: 'pipe'
            }).trim();
            if (name) return name;
        } catch (e) { /* continue */ }
    }

    if (require('os').platform() === 'darwin') {
        const termProgram = process.env.TERM_PROGRAM || '';
        try {
            if (termProgram === 'iTerm.app') {
                const name = execSync(
                    'osascript -e \'tell application "iTerm2" to tell current session of current tab of current window to get name\'',
                    { encoding: 'utf8', timeout: 2000, stdio: 'pipe' }
                ).trim();
                if (name) return name;
            }
            if (termProgram === 'Apple_Terminal') {
                const name = execSync(
                    'osascript -e \'tell application "Terminal" to get custom title of selected tab of front window\'',
                    { encoding: 'utf8', timeout: 2000, stdio: 'pipe' }
                ).trim();
                if (name) return name;
            }
        } catch (e) { /* continue */ }
    }

    return null;
}

/**
 * 加载配置
 */
function loadConfig() {
    try {
        const configPath = path.join(__dirname, 'config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const envVars = envConfig.getAllConfig();
        if (envVars.feishu.webhook_url) {
            config.notification.feishu.webhook_url = envVars.feishu.webhook_url;
            config.notification.feishu.enabled = true;
        }
        if (process.env.SOUND_ENABLED !== undefined) {
            config.notification.sound.enabled = envVars.sound.enabled;
        }
        return config;
    } catch (error) {
        const envVars = envConfig.getAllConfig();
        return {
            notification: {
                type: envVars.feishu.enabled ? 'feishu' : 'sound',
                feishu: envVars.feishu,
                sound: envVars.sound
            }
        };
    }
}

/**
 * 获取项目名称
 */
function getProjectName(cwd) {
    const workDir = cwd || process.cwd();
    try {
        const pkgPath = path.join(workDir, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            if (pkg.name) return pkg.name;
        }
    } catch (e) { /* continue */ }
    return path.basename(workDir);
}

// ── 主流程 ──

(async () => {
    const data = parseCodexArg();

    // 仅处理 agent-turn-complete
    if (data && data.type !== 'agent-turn-complete') {
        process.exit(0);
    }

    const config = loadConfig();
    const terminalName = getTerminalName();
    const projectName = getProjectName(data?.cwd);

    // 生成消息
    const summary = extractCodexSummary(data);
    let message = summary ? `已完成: ${summary}` : 'Codex 任务已完成';
    if (terminalName) message = `${terminalName}，${message}`;

    console.log(`🚀 Codex 通知 | 项目: ${projectName}`);
    console.log(`📝 ${message}`);

    // 飞书推送
    const notificationManager = new NotificationManager(config, projectName);
    await notificationManager.sendAllNotifications(message);

    // 声音提醒
    if (config.notification.sound.enabled) {
        notifyTaskCompletion('Stop', null, terminalName);
    }

    setTimeout(() => process.exit(0), 3000);
})();
