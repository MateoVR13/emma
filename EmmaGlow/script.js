// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DE LA APLICACIÓN ---
    let currentUser = null;
    let currentAnalysis = {};

    // --- BASE DE DATOS DE PRODUCTOS ---
    const products = [
        { id: 1, name: 'Limpiador en Gel', brand: 'CeraVe', price: 'COP 65.000', emoji: '🧼', tags: ['grasa', 'acne', 'poros'] },
        { id: 2, name: 'Limpiador Hidratante', brand: 'La Roche-Posay', price: 'COP 89.900', emoji: '💧', tags: ['seca', 'sensible'] },
        { id: 3, name: 'Sérum de Niacinamida', brand: 'The Ordinary', price: 'COP 55.000', emoji: '✨', tags: ['grasa', 'manchas', 'poros'] },
        { id: 4, name: 'Sérum de Retinol', brand: 'Neutrogena', price: 'COP 120.000', emoji: '⏳', tags: ['arrugas', 'manchas'] },
        { id: 5, name: 'Crema Hidratante', brand: 'Cetaphil', price: 'COP 75.000', emoji: '🧴', tags: ['seca', 'sensible', 'mixta'] },
        { id: 6, name: 'Protector Solar Toque Seco', brand: 'ISDIN', price: 'COP 95.000', emoji: '☀️', tags: ['grasa', 'mixta', 'sensible'] },
        { id: 7, name: 'Protector Solar Hidratante', brand: 'Vichy', price: 'COP 85.000', emoji: '☀️', tags: ['seca'] }
    ];
    
    // --- ELEMENTOS DEL DOM ---
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-btn');
    const loginForm = document.getElementById('login-form'), registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register'), showLoginLink = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-form-container'), registerContainer = document.getElementById('register-form-container');
    const bottomNav = document.querySelector('.bottom-nav');
    
    // Elementos de análisis de imagen
    const imageUploadInput = document.getElementById('image-upload-input');
    const imagePreview = document.getElementById('image-preview');
    const startAnalysisBtn = document.getElementById('start-analysis-btn');
    const analysisLoader = document.getElementById('analysis-loader');
    
    // Elementos de análisis detallado
    const detailedForm = document.getElementById('detailed-analysis-form');
    
    // Elementos de recomendaciones e historial
    const productGrid = document.getElementById('product-grid');
    const saveRoutineBtn = document.getElementById('save-routine-btn');
    const historyList = document.getElementById('history-list');

    // Elementos del Chatbot
    const chatbotFab = document.getElementById('chatbot-fab'), chatbotContainer = document.getElementById('chatbot-container');
    const closeChatBtn = document.getElementById('close-chat-btn'), sendChatBtn = document.getElementById('send-chat-btn');
    const chatInput = document.getElementById('chat-input'), chatMessages = document.getElementById('chat-messages');

    // --- NAVEGACIÓN ---
    function showPage(pageId) {
        if (currentUser) {
            document.getElementById('login-page').classList.remove('active');
            bottomNav.style.display = 'flex';
        } else {
             bottomNav.style.display = 'none';
        }
        pages.forEach(p => p.classList.toggle('active', p.id === pageId));
        navButtons.forEach(b => b.classList.toggle('active', b.dataset.page === pageId));
        
        if (pageId === 'history-page' && currentUser) {
            renderHistory();
        }
    }

    navButtons.forEach(b => b.addEventListener('click', () => showPage(b.dataset.page)));
    
    // --- AUTENTICACIÓN ---
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginContainer.style.display = 'none'; registerContainer.style.display = 'block'; });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerContainer.style.display = 'none'; loginContainer.style.display = 'block'; });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await addUser({ name: e.target.elements['register-name'].value, email: e.target.elements['register-email'].value });
            alert('¡Registro exitoso!');
            showLoginLink.click();
        } catch (error) { alert('Este correo ya está registrado.'); }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = await getUser(e.target.elements['login-email'].value);
        if (user) {
            currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            initializeApp();
        } else {
            alert('Usuario no encontrado.');
        }
    });

    // --- FLUJO DE ANÁLISIS ---
    imageUploadInput.addEventListener('change', () => {
        const file = imageUploadInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                startAnalysisBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    });

    startAnalysisBtn.addEventListener('click', () => {
        analysisLoader.style.display = 'block';
        startAnalysisBtn.style.display = 'none';
        // Simulación de 2.5 segundos de análisis
        setTimeout(() => {
            showPage('detailed-analysis-page');
            analysisLoader.style.display = 'none';
            startAnalysisBtn.style.display = 'block';
        }, 2500);
    });
    
    detailedForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const skinType = e.target.elements['skin-type'].value;
        const concerns = Array.from(e.target.elements['skin-concern']).filter(cb => cb.checked).map(cb => cb.value);
        
        if (!skinType) {
            alert("Por favor, selecciona tu tipo de piel.");
            return;
        }

        currentAnalysis = { skinType, concerns };
        generateRecommendations();
        showPage('recommendations-page');
    });

    // --- RECOMENDACIONES Y PRODUCTOS ---
    function generateRecommendations() {
        productGrid.innerHTML = '';
        const userTags = [currentAnalysis.skinType, ...currentAnalysis.concerns];
        
        let recommendedProducts = products.filter(p => p.tags.some(tag => userTags.includes(tag)));
        
        // Asegurar que siempre haya un protector solar
        if (!recommendedProducts.some(p => p.name.includes('Protector Solar'))) {
             recommendedProducts.push(products.find(p => p.emoji === '☀️'));
        }

        // Eliminar duplicados
        recommendedProducts = [...new Set(recommendedProducts)];
        
        currentAnalysis.recommendedProducts = recommendedProducts.map(p => p.id); // Guardar IDs para el historial
        
        renderProducts(recommendedProducts);
    }
    
    function renderProducts(productsToRender) {
        if (productsToRender.length === 0) {
            productGrid.innerHTML = "<p>No encontramos productos específicos, pero un limpiador suave y protector solar son esenciales para todos.</p>";
            return;
        }
        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-image">${product.emoji}</div>
                <div class="product-info">
                    <div class="product-brand">${product.brand}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${product.price}</div>
                </div>
            `;
            productGrid.appendChild(card);
        });
    }

    // --- HISTORIAL ---
    saveRoutineBtn.addEventListener('click', async () => {
        const routine = {
            userEmail: currentUser.email,
            date: new Date().toLocaleDateString('es-CO'),
            analysis: currentAnalysis,
        };
        try {
            await addAnalysis(routine);
            alert('¡Tu rutina ha sido guardada en el historial!');
        } catch (error) {
            console.error("Error guardando rutina:", error);
            alert('Hubo un problema al guardar tu rutina.');
        }
    });

    async function renderHistory() {
        historyList.innerHTML = '';
        const analyses = await getAnalyses(currentUser.email);
        if (analyses.length === 0) {
            historyList.innerHTML = '<p>Aún no tienes rutinas guardadas.</p>';
            return;
        }
        
        analyses.reverse().forEach(item => {
            const recommended = item.analysis.recommendedProducts
                .map(id => products.find(p => p.id === id).name)
                .join(', ');

            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-date">${item.date}</div>
                <p><strong>Tipo de Piel:</strong> ${item.analysis.skinType}</p>
                <p><strong>Preocupaciones:</strong> ${item.analysis.concerns.join(', ') || 'Ninguna'}</p>
                <p><strong>Recomendación:</strong> ${recommended}</p>
            `;
            historyList.appendChild(historyItem);
        });
    }
    
    // --- CHATBOT (EMMA) ---
    chatbotFab.addEventListener('click', () => { chatbotContainer.classList.add('open'); chatbotFab.style.display = 'none'; });
    closeChatBtn.addEventListener('click', () => { chatbotContainer.classList.remove('open'); chatbotFab.style.display = 'flex'; });
    sendChatBtn.addEventListener('click', handleChat);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChat(); });

    async function handleChat() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        addMessageToChat(userMessage, 'user');
        chatInput.value = '';
        chatInput.disabled = true;

        try {
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });
            
            if (!response.ok) throw new Error(`Error del servidor`);
            const data = await response.json();
            addMessageToChat(data.reply, 'emma');
        } catch (error) {
            console.error('Error con el chatbot:', error);
            addMessageToChat('Lo siento, no pude conectarme. Inténtalo de nuevo.', 'emma');
        } finally {
            chatInput.disabled = false;
            chatInput.focus();
        }
    }
    
    function addMessageToChat(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- INICIALIZACIÓN DE LA APP ---
    function initializeApp() {
        if (currentUser) {
            showPage('image-analysis-page');
        } else {
            showPage('login-page');
        }
    }
    
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    
    initializeApp();
});