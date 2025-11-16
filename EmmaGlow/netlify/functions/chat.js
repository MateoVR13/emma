// netlify/functions/chat.js
GEMINI_API_KEY = "AIzaSyD0I8RVJy8BJARHqZzjaj61ZMwaqK7CQjk";

// IMPORTANTE: Primero debes instalar el SDK de Google con: npm install @google/generative-ai
const { GoogleGenerativeAI } = require("@google/generative-ai");

// La API Key se obtiene de las variables de entorno de Netlify
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { message } = JSON.parse(event.body);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // **Personaliza el rol del chatbot aquí**
        const prompt = `Eres Emma, una experta amigable y profesional en cuidado de la piel. Responde de manera concisa y útil a las preguntas sobre rutinas, ingredientes y problemas de la piel. Tu objetivo es ayudar y educar. Usuario pregunta: "${message}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: text }),
        };

    } catch (error) {
        console.error("Error en la función de chat:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "No se pudo procesar la solicitud." }),
        };
    }
};