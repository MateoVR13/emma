// /netlify/functions/chat.js

const fetch = require('node-fetch');

// La URL de la API de OpenRouter es estándar para todas las solicitudes de chat
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Tu clave de API se obtiene de las variables de entorno de Netlify
const API_KEY = process.env.OPENROUTER_API_KEY;

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { message } = JSON.parse(event.body);

        if (!message) {
            return { statusCode: 400, body: JSON.stringify({ error: 'No message provided.' }) };
        }

        // Preparamos las cabeceras. OpenRouter usa un Bearer Token.
        const headers = {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            // Opcional pero recomendado: identifica tu app en OpenRouter
            'HTTP-Referer': 'https://emma-glow.netlify.app', 
            'X-Title': 'Emma Glow',
        };

        // El cuerpo de la solicitud para OpenRouter/OpenAI.
        const requestBody = {
            // --- ¡PUEDES CAMBIAR EL MODELO AQUÍ! ---
            // Elige cualquier modelo de OpenRouter, incluso los gratuitos.
            // "mistralai/mistral-7b-instruct" es una excelente opción gratuita.
            "model": "mistralai/mistral-7b-instruct", 
            "messages": [
                {
                    "role": "system",
                    "content": "Eres Emma, una experta amigable y profesional en cuidado de la piel. Responde de manera concisa y útil a las preguntas sobre rutinas, ingredientes y problemas de la piel. Tu objetivo es ayudar y educar."
                },
                {
                    "role": "user",
                    "content": message
                }
            ]
        };

        // Hacemos la solicitud a la API de OpenRouter
        const apiResponse = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.json();
            console.error("Error from OpenRouter API:", errorBody);
            throw new Error(`API responded with status: ${apiResponse.status}`);
        }

        const responseData = await apiResponse.json();
        
        // Extraemos el texto de la respuesta. La estructura es diferente a la de Gemini.
        const botReply = responseData.choices[0].message.content;

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: botReply }),
        };

    } catch (error) {
        console.error("Error in chat function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An internal error occurred." }),
        };
    }
};
