/**
 * bot.js
 * Entry point – Telegram bot with polling.
 * Uses Gemini AI for friendly chat and intelligent task creation.
 */

const TelegramBot = require('node-telegram-bot-api');
const { TELEGRAM_TOKEN, ALLOWED_USER_ID } = require('./config');
const { processMessage } = require('./gemini');
const { appendTask, updateTask } = require('./sheets');

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Track the last created task's row for editing
let lastTaskRow = null;
let botUsername = '';

// Fetch bot username on startup
bot.getMe().then((me) => {
    botUsername = me.username.toLowerCase();
    console.log(`🤖 Bot @${me.username} is running...`);
});

bot.on('message', async (msg) => {
    try {
        // Only respond to the allowed user
        // if (msg.from.id !== ALLOWED_USER_ID) return;

        // Ignore messages without text
        if (!msg.text) return;

        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

        let text = msg.text;

        if (isGroup) {
            // In groups, only respond when bot is mentioned
            const mentionTag = `@${botUsername}`;
            if (!text.toLowerCase().includes(mentionTag)) return;

            // Remove the @mention from the text before processing
            text = text.replace(new RegExp(`@${botUsername}`, 'gi'), '').trim();
            if (!text) return;
        }

        // Process through Gemini AI
        const result = await processMessage(text);
        console.log(result, 'result');

        if (result.action === 'create' && result.title) {
            // Create the task in Google Sheets
            const task = {
                title: result.title,
                deadline: result.deadline || null,
                assignee: result.assignee || 'Kiệt',
                status: result.status || 'Chưa bắt đầu',
            };

            lastTaskRow = await appendTask(task);

            // Build detailed reply
            const reply = [
                `Dưới đây là thông tin chi tiết task mình đã tạo cho bạn:`,
                ``,
                `📌 Hành động: Tạo mới task`,
                ``,
                `📝 Tên task: ${task.title}`,
                ``,
                `👤 Người phụ trách: ${task.assignee}`,
                ``,
                `👤 Người giao: Kiệt`,
                ``,
                `📅 Deadline: ${task.deadline || 'Không có'}`,
                ``,
                `📂 Trạng thái: ${task.status}`,
                ``,
                result.reply || `Đã tạo thành công và đã giao cho ${task.assignee} ✅`,
            ].join('\n');

            await bot.sendMessage(msg.chat.id, reply);

        } else if (result.action === 'edit') {
            // Edit the last created task
            if (!lastTaskRow) {
                await bot.sendMessage(msg.chat.id, 'Chưa có task nào để sửa nè 😅');
                return;
            }

            await updateTask(lastTaskRow, {
                title: result.title || null,
                deadline: result.deadline || null,
            });

            const reply = [
                `Dưới đây là thông tin task đã được cập nhật:`,
                ``,
                `📌 Hành động: Sửa task`,
                ``,
                result.title ? `📝 Tên task: ${result.title}` : null,
                result.deadline ? `📅 Deadline: ${result.deadline}` : null,
                ``,
                result.reply || `Đã cập nhật thành công ✅`,
            ].filter(Boolean).join('\n');

            await bot.sendMessage(msg.chat.id, reply);

        } else {
            // Just a friendly chat reply
            await bot.sendMessage(msg.chat.id, result.reply);
        }
    } catch (error) {
        console.error('Error handling message:', error);
        await bot.sendMessage(msg.chat.id, 'Oops, mình gặp lỗi rồi 😅 Thử lại nhé!');
    }
});
