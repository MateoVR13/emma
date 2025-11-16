// /netlify/functions/chat.js

// Importa el paquete necesario
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inicializa el cliente de la API usando la variable de entorno de Netlify
// Asegúrate de que tu variable en Netlify se llame GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Esta es la función principal que Netlify ejecutará
exports.handler = async function (event) {
    
    // Solo permitir solicitudes de tipo POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Extrae el mensaje del usuario del cuerpo de la solicitud
        const { message } = JSON.parse(event.body);

        // Si no hay mensaje, devuelve un error
        if (!message) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: 'No message provided.' }) 
            };
        }
        
        // Selecciona el modelo de IA a utilizar
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Crea el prompt, dándole contexto a la IA sobre su rol
        const prompt = `Eres Emma, una experta amigable y profesional en cuidado de la piel. Responde de manera concisa y útil a las preguntas sobre rutinas, ingredientes y problemas de la piel. Tu objetivo es ayudar y educar. La pregunta del usuario es: "${message}"`;

        // Genera el contenido basado en el prompt
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Si todo sale bien, devuelve la respuesta de la IA
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply: text }),
        };

    } catch (error) {
        // Si ocurre cualquier error durante el proceso, lo registra en los logs de Netlify
        console.error("Error in chat function:", error);
        
        // Y devuelve un error genérico al usuario
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An internal error occurred." }),
        };
    }
}; // <-- Esta es probablemente la llave que faltaba
