const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inicializa el cliente de la API usando la variable de entorno de Netlify
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event) {
    // Solo permitir solicitudes POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { message } = JSON.parse(event.body);

        if (!message) {
            return { statusCode: 400, body: JSON.stringify({ error: 'No message provided.' }) };
        }
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Eres Emma, una experta amigable y profesional en cuidado de la piel. Responde de manera concisa y útil a las preguntas sobre rutinas, ingredientes y problemas de la piel. Tu objetivo es ayudar y educar. La pregunta del usuario es: "${message}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply: text }),
        };

    } catch (error) {
        // Log del error en Netlify para que puedas depurarlo
        console.error("Error in chat function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An internal error occurred." }),
        };
    }
};```
