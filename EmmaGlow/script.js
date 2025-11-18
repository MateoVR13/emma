document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DE LA APLICACIÓN ---
    let currentUser = null;
    let currentAnalysis = {};

    // --- BASE DE DATOS DE PRODUCTOS REALES ---
    const products = [
        { id: 1, name: 'Effaclar Gel Limpiador', brand: 'La Roche-Posay', price: 'COP 85.000', img: 'https://farmatodo.vteximg.com.br/arquivos/ids/206968-1000-1000/7702058000451_1.jpg?v=637594957640400000', tags: ['grasa', 'acne', 'poros-dilatados', 'mixta'] },
        { id: 2, name: 'Limpiador Hidratante', brand: 'CeraVe', price: 'COP 65.000', img: 'https://farmatodo.vteximg.com.br/arquivos/ids/211753-1000-1000/7506306245366_1.jpg?v=637651088613170000', tags: ['seca', 'sensible', 'deshidratacion', 'normal'] },
        { id: 3, name: 'Niacinamide 10% + Zinc 1%', brand: 'The Ordinary', price: 'COP 55.000', img: 'https://images.ctfassets.net/jdgtuh2uadx0/5V4R65i3S0s21b52L0T9sJ/c11a2f64f4f1a4e15f535567675f9227/Niacinamide_10__-_Zinc_1__30ml.png', tags: ['grasa', 'manchas', 'poros-dilatados'] },
        { id: 4, name: 'Retinol B3 Serum', brand: 'La Roche-Posay', price: 'COP 210.000', img: 'https://www.bellapiel.com.co/media/catalog/product/cache/2a084c8a514d02a065a38b6951235b6c/s/e/serum-la-roche-posay-retinol-b3-30ml.jpg', tags: ['arrugas', 'manchas'] },
        { id: 5, name: 'Crema Hidratante Facial', brand: 'Cetaphil', price: 'COP 75.000', img: 'https://www.cetaphil.com.co/sites/default/files/2022-09/CETAPHIL_HIDRATANTE%20FACIAL%20DE%20D%C3%8DA%20CON%20%C3%81CIDO%20HIALUR%C3%93NICO_IMAGEN%20PRINCIPAL.png', tags: ['seca', 'sensible', 'deshidratacion'] },
        { id: 6, name: 'Fusion Water MAGIC SPF 50', brand: 'ISDIN', price: 'COP 95.000', img: 'https://cdn.shopify.com/s/files/1/0329/4931/2339/files/8429420233488_1_900x.png?v=1686766468', tags: ['grasa', 'mixta', 'sensible', 'TODOS'] },
        { id: 8, name: 'Agua Micelar Sensibio H2O', brand: 'Bioderma', price: 'COP 70.000', img: 'https://www.cruzverde.com.co/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-master-catalog-cruz-verde/default/dw1519ebce/images/large/100411-1-AGUA-MICELAR-BIODERMA-SENSIBIO-H2O-500ML.jpg?sw=1000&sh=1000', tags: ['sensible', 'rojeces', 'TODOS'] }
    ];

    // --- ELEMENTOS DEL DOM ---
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-btn');
    const loginForm = document.getElementById('login-form'), registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register'), showLoginLink = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-form-container'), registerContainer = document.getElementById('register-form-container');
    const bottomNav = document.querySelector('.bottom-nav');
    const imageUploadInput = document.getElementById('image-upload-input'), imagePreview = document.getElementById('image-preview');
    const startAnalysisBtn = document.getElementById('start-analysis-btn'), analysisLoader = document.getElementById('analysis-loader');
    const skinAnalysisForm = document.getElementById('skin-analysis-form'), additionalFactorsForm = document.getElementById('additional-factors-form');
    const productGrid = document.getElementById('product-grid'), saveRoutineBtn = document.getElementById('save-routine-btn');
    const historyList = document.getElementById('history-list');
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
        if (pageId === 'history-page' && currentUser) renderHistory();
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
        } else { alert('Usuario no encontrado.'); }
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
        setTimeout(() => {
            showPage('skin-analysis-page');
            analysisLoader.style.display = 'none';
            startAnalysisBtn.style.display = 'block';
        }, 2500);
    });
    
    skinAnalysisForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const skinType = e.target.querySelector('input[name="skin-type"]:checked');
        if (!skinType) {
            alert('Por favor, selecciona tu tipo de piel.');
            return;
        }
        currentAnalysis.skinType = skinType.value;
        currentAnalysis.allergies = Array.from(e.target.querySelectorAll('input[name="allergies"]:checked')).map(cb => cb.value);
        currentAnalysis.conditions = Array.from(e.target.querySelectorAll('input[name="conditions"]:checked')).map(cb => cb.value);
        showPage('additional-factors-page');
    });

    additionalFactorsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentAnalysis.stressLevel = e.target.querySelector('#stress-level').value;
        currentAnalysis.sleepHours = e.target.querySelector('#sleep-hours').value;
        currentAnalysis.location = e.target.querySelector('#location').value;
        generateRecommendations();
        showPage('recommendations-page');
    });

    // --- RECOMENDACIONES Y PRODUCTOS ---
    function generateRecommendations() {
        productGrid.innerHTML = '';
        const userTags = [currentAnalysis.skinType, ...currentAnalysis.conditions];
        let recommendedProducts = products.filter(p => p.tags.some(tag => userTags.includes(tag)));
        
        let cleanser = products.find(p => p.name.toLowerCase().includes('limpiador') && p.tags.includes(currentAnalysis.skinType));
        if (!cleanser) cleanser = products.find(p => p.name.toLowerCase().includes('micelar'));
        
        let sunscreen = products.find(p => p.tags.includes('TODOS'));

        if (cleanser && !recommendedProducts.includes(cleanser)) recommendedProducts.unshift(cleanser);
        if (sunscreen && !recommendedProducts.includes(sunscreen)) recommendedProducts.push(sunscreen);
        
        recommendedProducts = [...new Set(recommendedProducts)];
        currentAnalysis.recommendedProducts = recommendedProducts.map(p => p.id);
        renderProducts(recommendedProducts);
    }
    
    function renderProducts(productsToRender) {
        productGrid.innerHTML = '';
        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `<div class="product-image" style="background-image: url('${product.img}')"></div><div class="product-info"><div class="product-brand">${product.brand}</div><div class="product-name">${product.name}</div><div class="product-price">${product.price}</div></div>`;
            productGrid.appendChild(card);
        });
    }

    // --- HISTORIAL ---
    saveRoutineBtn.addEventListener('click', async () => {
        const routine = { userEmail: currentUser.email, date: new Date().toLocaleDateString('es-CO'), analysis: currentAnalysis };
        try {
            await addAnalysis(routine);
            alert('¡Tu rutina ha sido guardada!');
        } catch (error) { alert('Hubo un problema al guardar tu rutina.'); }
    });

    async function renderHistory() {
        historyList.innerHTML = '';
        const analyses = await getAnalyses(currentUser.email);
        if (analyses.length === 0) {
            historyList.innerHTML = '<p>Aún no tienes rutinas guardadas.</p>';
            return;
        }
        analyses.reverse().forEach(item => {
            const recommended = item.analysis.recommendedProducts.map(id => products.find(p => p.id === id)?.name || 'Producto eliminado').join(', ');
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `<div class="history-date">${item.date}</div><p><strong>Tipo de Piel:</strong> ${item.analysis.skinType}</p><p><strong>Preocupaciones:</strong> ${item.analysis.conditions.join(', ') || 'Ninguna'}</p><p><strong>Recomendación:</strong> ${recommended}</p>`;
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
            const response = await fetch('/.netlify/functions/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMessage }) });
            if (!response.ok) throw new Error(`Error del servidor`);
            const data = await response.json();
            addMessageToChat(data.reply, 'emma');
        } catch (error) {
            addMessageToChat('Lo siento, no pude conectarme. Inténtalo de nuevo.', 'emma');
        } finally {
            chatInput.disabled = false;
            chatInput.focus();
        }
    }
    
    // Usa esta versión simple por ahora
    function addMessageToChat(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text; // Usamos textContent, no innerHTML
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }


    // --- INICIALIZACIÓN ---
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



