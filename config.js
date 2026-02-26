/**
 * config.js
 * Loads and validates environment variables.
 */

require('dotenv').config();

const REQUIRED_VARS = ['TELEGRAM_TOKEN', 'SHEET_ID', 'ALLOWED_USER_ID'];

for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

module.exports = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  SHEET_ID: process.env.SHEET_ID,
  ALLOWED_USER_ID: Number(process.env.ALLOWED_USER_ID),
};
