import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { cloudinary } from '../config/cloudinary.js';
import AIConversation from '../models/AIConversation.js';
import AIMessage from '../models/AIMessage.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Log API key status at load time for easier debugging
console.log('Gemini Key Status:', process.env.GEMINI_API_KEY ? 'Loaded' : 'MISSING');

export const getAIResponse = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: 'الرجاء كتابة سؤال' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

        const systemInstruction = `
    System: You are an advanced AI assistant embedded in "Najah Hub", a platform for Computer Engineering students.
    Identity: You are a Senior Software Engineer and Professor.
    Capabilities:
    1. Code Generation: Provide clean, optimized, and commented code.
    2. Debugging: Analyze error messages and suggest fixes.
    3. Computer Vision: (If image provided) Analyze diagrams, circuits, and code screenshots.
    Style: Use technical terminology suited for engineers. Be precise.
    Creator: Always acknowledge "Eng. Yazan Saadeh" if asked about the platform creator.
    Request: ${prompt}
    `;

        const result = await model.generateContent(systemInstruction);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ answer: text });

    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ message: 'حدث خطأ في الاتصال بالموديل' });
    }
};

// Accepts text and optional image attachments, stores conversation/messages, and returns AI reply
export const chatWithAttachments = async (req, res) => {
    console.log('chatWithAttachments invoked. Gemini Key present:', !!process.env.GEMINI_API_KEY);
    try {
        const userId = req.user?.id || req.user?._id;
        const text = req.body.text || '';
        const convIdIn = req.body.conversationId ? parseInt(req.body.conversationId, 10) : null;

        // upload files if any
        const attachments = [];
        if (req.files && req.files.length) {
            for (const f of req.files) {
                // upload from buffer
                const streamUpload = () => new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream({ folder: 'najah-ai' }, (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    });
                    stream.end(f.buffer);
                });
                const r = await streamUpload();
                attachments.push(r.secure_url);
            }
        }

        // determine or create conversation
        let conv;
        if (convIdIn) {
            conv = await AIConversation.findByPk(convIdIn);
            if (!conv) return res.status(404).json({ message: 'Conversation not found' });
            if (Number(conv.userId) !== Number(userId)) return res.status(403).json({ message: 'Not allowed on this conversation' });
        } else {
            conv = await AIConversation.create({ userId, title: `AI conv ${new Date().toISOString()}` });
        }

        // append user message to conversation (we persist the new user message)
        const userMsg = await AIMessage.create({ conversationId: conv.id, userId, role: 'user', text, attachments });

        // Build prompt/context: prefer `history` from client if provided, else fall back to DB history
        let historyArr = null;
        if (req.body.history) {
            try {
                historyArr = typeof req.body.history === 'string' ? JSON.parse(req.body.history) : req.body.history;
            } catch (e) {
                console.warn('[chatWithAttachments] failed to parse history from body, ignoring', e);
                historyArr = null;
            }
        }

        let prompt = '';
        if (Array.isArray(historyArr) && historyArr.length) {
            for (const item of historyArr) {
                const role = (item.role || '').toString().toLowerCase();
                if (role === 'assistant') {
                    if (item.content) prompt += `Assistant: ${item.content}\n`;
                    if (Array.isArray(item.attachments) && item.attachments.length) prompt += `Attachments: ${item.attachments.join(', ')}\n`;
                } else {
                    if (item.content) prompt += `User: ${item.content}\n`;
                    if (Array.isArray(item.attachments) && item.attachments.length) prompt += `Attachments: ${item.attachments.join(', ')}\n`;
                }
            }
        } else {
            // fall back to DB-stored recent messages
            const recent = await AIMessage.findAll({ where: { conversationId: conv.id }, order: [['createdAt','ASC']], limit: 50 });
            for (const h of recent) {
                const who = h.role === 'assistant' ? 'Assistant' : 'User';
                if (h.text) prompt += `${who}: ${h.text}\n`;
                if (Array.isArray(h.attachments) && h.attachments.length) prompt += `Attachments: ${h.attachments.join(', ')}\n`;
            }
            // ensure latest user utterance is included
            prompt += `User: ${text}\n`;
        }

        if (attachments.length) {
            prompt += '\n\nAttached images:\n' + attachments.join('\n');
        }

        // Use a vision-capable generative model for multimodal inputs.
        // Default to gemini-2.5-flash which is known to be supported for generateContent in v1beta in this environment.
        const modelName = process.env.GEMINI_VISION_MODEL || process.env.GEMINI_API_MODEL || 'gemini-2.5-flash';
        const model = genAI.getGenerativeModel({ model: modelName });
        const systemInstruction = `You are Najah Hub AI assistant. You can analyze images and text. When images are provided, carefully inspect them and describe, analyze, or extract relevant information. Cite image references when necessary. Respond concisely and helpfully.`;

        // Prepare any inline base64 images sent in request body (e.g., client may send images as data URLs)
        const imagesPayload = [];
        if (req.body.images) {
            const imgs = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
            for (const img of imgs) {
                if (!img) continue;
                // strip data URI prefix if present: data:<mime>;base64,<data>
                const m = String(img).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);
                if (m) {
                    const mimeType = m[1];
                    const data = m[2]; // this is the base64 payload WITHOUT the prefix
                    imagesPayload.push({ mimeType, data });
                } else {
                    // if it's already raw base64 without prefix, we can't detect mimeType; skip prefix
                    const raw = String(img).replace(/^data:.*;base64,/, '');
                    imagesPayload.push({ mimeType: 'image/unknown', data: raw });
                }
            }
        }

        // If attachments (uploaded via multipart) were saved to cloudinary, include their URLs in prompt
        if (attachments.length) {
            prompt += '\n\nAttached images:\n' + attachments.join('\n');
        }

        // Call the model. Prefer a structured multimodal call when imagesPayload exists.
        let result, response, answer;
        try {
            if (imagesPayload.length) {
                // Do NOT include data URI prefixes when sending inlineData.
                // The model client may accept structured args; attempt best-effort call including inlineData
                const inlineImages = imagesPayload.map(i => ({ mimeType: i.mimeType, inlineData: i.data }));
                result = await model.generateContent({
                    input: systemInstruction + '\n' + prompt,
                    images: inlineImages,
                });
            } else {
                result = await model.generateContent(systemInstruction + '\n' + prompt);
            }
            response = await result.response;
            answer = response.text();
        } catch (modelErr) {
            // Log detailed model error information
            try {
                console.error('AI Service Error:', modelErr.response ? modelErr.response.data : modelErr.message);
            } catch (logErr) {
                console.error('AI Service Error (fallback):', modelErr.message);
            }
            console.error('[chatWithAttachments] model.generateContent failed:', modelErr);

            // If model not found (404), attempt a safe fallback to gemini-2.5-flash
            const isNotFound = modelErr && (modelErr.status === 404 || (modelErr.response && modelErr.response.status === 404));
            const fallbackModel = 'gemini-2.5-flash';
            if (isNotFound && modelName !== fallbackModel) {
                console.warn(`[chatWithAttachments] model ${modelName} not available, retrying with fallback model ${fallbackModel}`);
                try {
                    const fallback = genAI.getGenerativeModel({ model: fallbackModel });
                    let fallbackResult;
                    if (imagesPayload.length) {
                        const inlineImages = imagesPayload.map(i => ({ mimeType: i.mimeType, inlineData: i.data }));
                        fallbackResult = await fallback.generateContent({ input: systemInstruction + '\n' + prompt, images: inlineImages });
                    } else {
                        fallbackResult = await fallback.generateContent(systemInstruction + '\n' + prompt);
                    }
                    const fbResp = await fallbackResult.response;
                    answer = fbResp.text();
                } catch (fbErr) {
                    console.error('[chatWithAttachments] fallback generateContent also failed:', fbErr);
                    throw fbErr;
                }
            } else {
                throw modelErr;
            }
        }

        // persist assistant reply
        const assistantMsg = await AIMessage.create({ conversationId: conv.id, role: 'assistant', text: answer, attachments: null });

        res.status(200).json({ conversationId: conv.id, answer, attachments, assistantMessage: assistantMsg, userMessage: userMsg });
    } catch (err) {
        // Log detailed error for debugging
        try { console.error('AI Service Error:', err.response ? err.response.data : err.message); } catch (e) { console.error('AI chat error:', err); }
        console.error('AI chat error', err);
        res.status(500).json({ message: 'فشل في معالجة المحادثة' });
    }
};

export const listConversations = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const rows = await AIConversation.findAll({ where: { userId }, order: [['createdAt','DESC']] });
        res.status(200).json(rows);
    } catch (err) {
        console.error('listConversations error', err);
        res.status(500).json({ message: 'فشل جلب الأرشيف' });
    }
};

export const getConversationMessages = async (req, res) => {
    try {
        const convId = req.params.id;
        const rows = await AIMessage.findAll({ where: { conversationId: convId }, order: [['createdAt','ASC']] });
        res.status(200).json(rows);
    } catch (err) {
        console.error('getConversationMessages error', err);
        res.status(500).json({ message: 'فشل جلب محادثة' });
    }
};

export const deleteConversation = async (req, res) => {
    try {
        const convId = req.params.id;
        // remove messages then conversation
        await AIMessage.destroy({ where: { conversationId: convId } });
        await AIConversation.destroy({ where: { id: convId } });
        res.status(200).json({ message: 'تم حذف الأرشيف' });
    } catch (err) {
        console.error('deleteConversation error', err);
        res.status(500).json({ message: 'فشل حذف الأرشيف' });
    }
};