/**
 * sheets.js
 * Appends task rows to Google Sheets via Service Account auth.
 */

const { google } = require('googleapis');
const path = require('path');
const { SHEET_ID } = require('./config');

// Authenticate using the service account key file
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

/**
 * Format a Date object as DD/MM/YYYY.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
}

/**
 * Return the deadline string for the sheet.
 * Deadline is already in dd/mm/yyyy format from Gemini.
 * @param {string} deadline
 * @returns {string}
 */
function deadlineToDisplay(deadline) {
    return deadline;
}

/**
 * Find the first row where column B (Task) is empty, starting from row 2.
 * @returns {number} 1-indexed row number
 */
async function findFirstEmptyRow() {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!B2:B',
    });

    const rows = res.data.values || [];

    // Find first empty cell in column B
    for (let i = 0; i < rows.length; i++) {
        if (!rows[i] || !rows[i][0] || rows[i][0].toString().trim() === '') {
            return i + 2; // +2 because data starts at row 2
        }
    }

    // All rows have data, append after the last one
    return rows.length + 2;
}

/**
 * Insert a parsed task into the first empty row of the table.
 * Columns: STT | Task | Trạng thái | Người giao | Người được giao | Content | File | Ngày giao | Deadline | Remaining
 * @param {{ title: string, deadline: string | null }} task
 * @returns {number} The row number where the task was inserted
 */
async function appendTask(task) {
    const targetRow = await findFirstEmptyRow();

    // Only write columns B-J (skip A/STT since it's pre-filled)
    const row = [
        task.title,                                  // B: Task
        task.status || 'Chưa bắt đầu',                 // C: Trạng thái
        'Kiệt',                                     // D: Người giao (default)
        task.assignee || 'Kiệt',                     // E: Người được giao
        '',                                          // F: Content
        '',                                          // G: File
        formatDate(new Date()),                      // H: Ngày giao
        task.deadline ? deadlineToDisplay(task.deadline) : '',  // I: Deadline
        '',                                          // J: Remaining
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Sheet1!B${targetRow}:J${targetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [row],
        },
    });

    return targetRow;
}

/**
 * Update an existing task row in the sheet.
 * @param {number} row - The row number to update
 * @param {{ title?: string|null, deadline?: string|null }} updates
 */
async function updateTask(row, updates) {
    // Read the current row first
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `Sheet1!B${row}:J${row}`,
    });

    const current = (res.data.values && res.data.values[0]) || [];

    // Apply updates
    if (updates.title) {
        current[0] = updates.title;       // B: Task
    }
    if (updates.deadline) {
        current[7] = deadlineToDisplay(updates.deadline);  // I: Deadline
    }

    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Sheet1!B${row}:J${row}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [current],
        },
    });
}

module.exports = { appendTask, updateTask };
