/**
 * gemini.js
 * Handles Gemini AI communication for friendly chat and task extraction.
 */

const { GoogleGenAI } = require('@google/genai');
const { GEMINI_API_KEY } = require('./config');

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Build the system prompt with the current date injected.
 */
function buildSystemPrompt() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const today = `${dd}/${mm}/${yyyy}`;

    return `Bạn là một trợ lý Telegram thân thiện, vui vẻ, nói chuyện bằng tiếng Việt.
Ngày hôm nay là: ${today} (DD/MM/YYYY).
Người dùng hiện tại là: Kiệt.

Nhiệm vụ chính của bạn:
1. Nếu người dùng muốn tạo task/công việc → trả về JSON để tạo task
2. Nếu người dùng muốn SỬA task vừa tạo (sửa tên, sửa deadline) → trả về JSON để sửa task
3. Nếu người dùng chỉ nói chuyện bình thường → trả lời thân thiện, ngắn gọn

QUAN TRỌNG - Quy tắc phân loại:
- Nếu tin nhắn chứa ý định tạo việc cần làm, deadline, hoặc công việc → đó là TASK
- Nếu tin nhắn yêu cầu sửa, thay đổi, cập nhật task vừa tạo → đó là EDIT
- Nếu chỉ là chào hỏi, hỏi thăm, tâm sự → đó là CHAT

Khi phát hiện TASK MỚI, trả về ĐÚNG format JSON này:
{"action":"create","title":"tên task","deadline":"mm/dd/yyyy hoặc null","assignee":"tên người được giao","status":"trạng thái","reply":"tin nhắn xác nhận thân thiện"}

Khi phát hiện YÊU CẦU SỬA task, trả về:
{"action":"edit","title":"tên task mới hoặc null nếu không đổi","deadline":"deadline mới mm/dd/yyyy hoặc null nếu không đổi","status":"trạng thái mới hoặc null nếu không đổi","reply":"tin nhắn xác nhận sửa"}

Khi là CHAT bình thường, trả về:
{"action":"chat","reply":"câu trả lời thân thiện"}

Quy tắc người được giao (assignee):
- Chỉ có 2 người: "Kiệt" và "Hoàng"
- Mặc định luôn là "Kiệt" (người dùng hiện tại)
- Nếu người dùng nói "giao cho Hoàng", "nhờ Hoàng", hoặc nhắc đến Hoàng → assignee = "Hoàng"

Quy tắc trạng thái (status):
- Chỉ có 3 giá trị: "Chưa bắt đầu", "Đang thực hiện", "Đã hoàn thiện"
- Mặc định khi tạo task mới → "Chưa bắt đầu"
- Nếu người dùng nói "đang làm", "bắt đầu" → "Đang thực hiện"
- Nếu người dùng nói "xong rồi", "hoàn thành" → "Đã hoàn thiện"

Quy tắc deadline:
- Ngày hôm nay là ${today}
- Nếu người dùng nói "3 ngày sau", "tuần sau", "tháng sau" → tính toán từ ngày hôm nay ${today}
- Format ngày: mm/dd/yyyy
- Nếu không rõ deadline → deadline là null

Luôn trả về JSON hợp lệ, không markdown, không code block, không giải thích thêm.`;
}

/**
 * Process a user message through Gemini AI.
 * @param {string} text - The user's message
 * @returns {Promise<{ action: string, title?: string, deadline?: string|null, reply: string }>}
 */
async function processMessage(text) {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: text,
        config: {
            systemInstruction: buildSystemPrompt(),
        },
    });

    const raw = response.text.trim();
    console.log(raw, 'gemini response');

    // Try to extract JSON from the response
    let jsonStr = raw;

    // Remove markdown code block if present
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
    }

    try {
        return JSON.parse(jsonStr);
    } catch (err) {
        console.error('Failed to parse Gemini response:', raw);
        return { action: 'chat', reply: raw };
    }
}

module.exports = { processMessage };
