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
 * Append a parsed task to the Google Sheet.
 * @param {{ title: string, deadline: string | null }} task
 */
async function appendTask(task) {
    const row = [
        task.title,
        task.deadline || '',
        'TODO',
        new Date().toISOString(),
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [row],
        },
    });
}

module.exports = { appendTask };
