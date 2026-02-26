/**
 * parser.js
 * Parses task text to extract title and optional deadline.
 */

/**
 * Parse a message into a task object.
 * @param {string} text - Raw message text
 * @returns {{ title: string, deadline: string | null } | null}
 *          Returns null if the resulting title is empty.
 */
function parseTask(text) {
    if (!text || typeof text !== 'string') return null;

    const dateRegex = /(\d{1,2})\/(\d{1,2})/;
    const match = text.match(dateRegex);

    let title = text;
    let deadline = null;

    if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);

        // Determine year: use current year, advance if date already passed
        const now = new Date();
        let year = now.getFullYear();
        const candidate = new Date(year, month - 1, day);

        if (candidate < now) {
            year += 1;
        }

        // Format as YYYY-MM-DD
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        deadline = `${dd}/${mm}/${year}`;

        // Remove the date portion from the title
        title = title.replace(dateRegex, '');

        // Remove the word "trước" if present
        title = title.replace(/trước/gi, '');
    }

    // Clean up whitespace
    title = title.replace(/\s+/g, ' ').trim();

    // If title is empty after cleaning, ignore
    if (!title) return null;

    return { title, deadline };
}

module.exports = { parseTask };
