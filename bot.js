/**
 * bot.js
 * Entry point – Telegram bot with polling.
 * Listens for text messages from the allowed user,
 * parses tasks, appends to Google Sheets, and replies.
 */

const TelegramBot = require('node-telegram-bot-api');
const { TELEGRAM_TOKEN, ALLOWED_USER_ID } = require('./config');
const { parseTask } = require('./parser');
const { appendTask } = require('./sheets');

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log('🤖 Bot is running...');

bot.on('message', async (msg) => {
    try {
        // Only respond to the allowed user
        if (msg.from.id !== ALLOWED_USER_ID) return;

        // Ignore messages without text
        if (!msg.text) return;

        // Parse the task
        const task = parseTask(msg.text);
        if (!task) return;

        // Append to Google Sheets
        await appendTask(task);

        // Build reply
        let reply = `✅ Đã tạo task: ${task.title}`;
        if (task.deadline) {
            reply += `\n📅 Deadline: ${task.deadline}`;
        }

        await bot.sendMessage(msg.chat.id, reply);
    } catch (error) {
        console.error('Error handling message:', error);
    }
});
