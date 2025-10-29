// Elementos do DOM
const chatContainer = document.getElementById('chat-container');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const chatForm = document.getElementById('chat-form');
const themeToggle = document.getElementById('theme-toggle');

// A declaração de sessionId foi movida para baixo no código

// Variável para controlar o indicador de digitação
let typingIndicator = null;

// Limpa as mensagens ao carregar a página
chatMessages.innerHTML = '';

// Função para mostrar o indicador de digitação
function showTypingIndicator() {
    if (typingIndicator) return; // Já está mostrando
    
    // Cria o container da mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    // Adiciona o avatar do bot
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar bot-avatar';
    const favicon = document.createElement('img');
    favicon.src = '/static/favicon.png';
    favicon.alt = 'Bot';
    favicon.style.width = '100%';
    favicon.style.height = '100%';
    favicon.style.borderRadius = '9999px';
    avatarDiv.style.padding = '2px';
    avatarDiv.style.backgroundColor = 'white';
    avatarDiv.appendChild(favicon);
    
    // Cria o container de conteúdo
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Cria o indicador de digitação
    typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    
    // Adiciona os pontos de digitação
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.className = 'typing-dot';
        typingIndicator.appendChild(dot);
    }
    
    // Monta a estrutura
    contentDiv.appendChild(typingIndicator);
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    // Adiciona ao chat
    chatMessages.appendChild(messageDiv);
    
    // Força o navegador a renderizar o elemento antes de adicionar a classe 'visible'
    setTimeout(() => {
        typingIndicator.classList.add('visible');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 10);
}

// Função para esconder o indicador de digitação
function hideTypingIndicator() {
    if (!typingIndicator) return;
    
    // Remove a classe 'visible' para iniciar a transição
    typingIndicator.classList.remove('visible');
    
    // Remove o elemento após a animação
    setTimeout(() => {
        if (typingIndicator) {
            const messageDiv = typingIndicator.closest('.message');
            if (messageDiv && messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
            typingIndicator = null;
        }
    }, 300); // Tempo da transição CSS
}

// Configuração do marked.js
marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function(code, lang) {
        // Você pode adicionar suporte a syntax highlighting aqui
        return code;
    }
});

// Configurações iniciais serão movidas para o DOMContentLoaded

async function typeText(element, text, speed = 5) {
    return new Promise((resolve) => {
        let i = 0;
        const typing = () => {
            if (i < text.length) {
                // Add the next character
                element.textContent = text.substring(0, i + 1);
                // Add cursor after the text
                const cursor = document.createElement('span');
                cursor.className = 'typing-cursor';
                element.appendChild(cursor);
                
                // Remove any previous cursor
                const prevCursor = element.querySelector('.typing-cursor:not(:last-child)');
                if (prevCursor) {
                    prevCursor.remove();
                }
                
                i++;
                chatContainer.scrollTop = chatContainer.scrollHeight;
                
                // Adjust speed based on character type
                let delay = speed;
                const currentChar = text.charAt(i);
                if (currentChar.match(/[.,!?;:]/)) {
                    delay *= 3; // Pause longer for punctuation
                } else if (currentChar.match(/\s/)) {
                    delay = speed * 1.5; // Slight pause for spaces
                }
                
                setTimeout(typing, delay);
            } else {
                // Remove cursor when done
                const cursor = element.querySelector('.typing-cursor');
                if (cursor) cursor.remove();
                resolve();
            }
        };
        
        // Start the typing effect
        typing();
    });
}

async function addMessage(message, isUser, skipHistory = false, skipLocalStorage = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = `avatar ${isUser ? 'user-avatar' : 'bot-avatar'}`;
    if (isUser) {
        avatarDiv.textContent = 'V';
    } else {
        const favicon = document.createElement('img');
        favicon.src = '/static/favicon.png';
        favicon.alt = 'Bot';
        favicon.style.width = '100%';
        favicon.style.height = '100%';
        favicon.style.borderRadius = '9999px';
        avatarDiv.textContent = ''; // Clear any text
        avatarDiv.style.padding = '2px'; // Add some padding
        avatarDiv.style.backgroundColor = 'white'; // Ensure white background for the icon
        avatarDiv.appendChild(favicon);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    
    // Add blinking cursor for bot messages
    if (!isUser) {
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        textDiv.appendChild(cursor);
    }
    
    contentDiv.appendChild(textDiv);
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Atualiza o histórico de mensagens
    if (!skipHistory && !skipLocalStorage) {
        const chatHistory = JSON.parse(localStorage.getItem(`chat_history_${sessionId}`)) || [];
        chatHistory.push({
            sender: isUser ? 'user' : 'bot',
            content: message
        });
        localStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(chatHistory));
    }

    // Se for mensagem do usuário, apenas exibe
    if (isUser) {
        textDiv.textContent = message;
        return;
    }
    
    // Para mensagens do bot, faz a animação de digitação
    try {
        // Processa o markdown primeiro
        const html = marked.parse(message);
        
        // Cria um elemento temporário para processar o HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Remove os elementos de código da animação (para não quebrar a formatação)
        const codeBlocks = tempDiv.querySelectorAll('pre, code');
        codeBlocks.forEach(block => {
            block.dataset.original = block.outerHTML;
            block.outerHTML = `[CODE_BLOCK_${Math.random().toString(36).substr(2, 9)}]`;
        });
        
        // Faz a animação de digitação
        const plainText = tempDiv.textContent;
        await typeText(textDiv, plainText);
        
        // Restaura os blocos de código formatados
        let finalHtml = textDiv.innerHTML;
        const codePlaceholders = finalHtml.match(/\[CODE_BLOCK_[a-z0-9]+\]/g) || [];
        
        codeBlocks.forEach((block, index) => {
            if (codePlaceholders[index]) {
                finalHtml = finalHtml.replace(codePlaceholders[index], block.dataset.original);
            }
        });
        
        // Aplica o HTML final com a formatação
        textDiv.innerHTML = finalHtml;
        
        // Adiciona botões de copiar para os blocos de código
        const preElements = textDiv.querySelectorAll('pre');
        preElements.forEach(pre => {
            const code = pre.querySelector('code');
            if (code) {
                pre.className = 'relative';
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-button absolute top-2 right-2 text-gray-300 hover:text-white p-1 rounded';
                copyButton.innerHTML = '<i class="far fa-copy"></i>';
                copyButton.title = 'Copiar código';
                copyButton.onclick = () => copyToClipboard(code.textContent);
                pre.appendChild(copyButton);
            }
        });
        
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        textDiv.textContent = message;
    }
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function addUserMessage(content, skipHistory = false) {
    return addMessage('user', content, skipHistory);
}

async function addBotMessage(content, skipHistory = false) {
    return addMessage('assistant', content, skipHistory);
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Feedback visual pode ser adicionado aqui
        console.log('Código copiado!');
    });
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // Desabilita o input e botão durante o envio
    userInput.disabled = true;
    sendButton.disabled = true;
    document.body.classList.add('input-disabled');
    
    // Adiciona a mensagem do usuário
    await addUserMessage(message);
    
    // Mostra o indicador de digitação
    showTypingIndicator();
    
    // Limpa o input e ajusta a altura
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Rola para a última mensagem
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    try {
        // Envia a mensagem para o servidor com o session_id
        const response = await fetch('/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: message,
                session_id: sessionId
            }),
        });
        
        if (!response.ok) {
            throw new Error('Erro ao enviar mensagem');
        }
        
        const data = await response.json();
        
        // Atualiza o session_id caso tenha sido gerado um novo
        if (data.session_id) {
            sessionId = data.session_id;
            localStorage.setItem('chat_session_id', sessionId);
        }
        
        // Esconde o indicador de digitação
        hideTypingIndicator();
        
        // Adiciona a resposta do bot
        await addBotMessage(data.response);
        
    } catch (error) {
        console.error('Erro:', error);
        hideTypingIndicator();
        await addBotMessage("❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.");
    } finally {
        // Reabilita o input e botão
        userInput.disabled = false;
        sendButton.disabled = false;
        document.body.classList.remove('input-disabled');
        userInput.focus();
    }
}

// Já movido para o topo do arquivo

// Gera um ID de sessão único se não existir
let sessionId = localStorage.getItem('chatSessionId');
if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatSessionId', sessionId);
}

// Carrega o histórico de mensagens do localStorage
function loadChatHistory() {
    console.log('Carregando histórico...');
    
    // Limpa as mensagens atuais
    chatMessages.innerHTML = '';
    
    // Mostra o estado de carregamento
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'text-center py-4 text-gray-500 dark:text-gray-400';
    loadingDiv.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Carregando mensagens...';
    chatMessages.appendChild(loadingDiv);
    
    // Usa setTimeout para garantir que o DOM seja atualizado antes de carregar as mensagens
    setTimeout(() => {
        const history = localStorage.getItem(`chatHistory_${sessionId}`);
        console.log('Histórico encontrado:', history);
        
        // Remove o indicador de carregamento
        chatMessages.innerHTML = '';
        
        let hasMessages = false;
        
        if (history) {
            try {
                const messages = JSON.parse(history);
                console.log('Mensagens parseadas:', messages);
                
                if (Array.isArray(messages) && messages.length > 0) {
                    console.log(`Encontradas ${messages.length} mensagens no histórico`);
                    hasMessages = true;
                    
                    // Remove o estado vazio se existir
                    const emptyState = document.querySelector('.empty-state');
                    if (emptyState) emptyState.remove();
                    
                    // Adiciona cada mensagem ao chat
                    messages.forEach((msg, index) => {
                        try {
                            if (msg && (msg.content || msg.content === 0 || msg.content === false)) {
                                const content = String(msg.content);
                                if (content.trim() !== '') {
                                    console.log(`Adicionando mensagem ${index + 1}:`, {role: msg.role, content: content.substring(0, 50) + '...'});
                                    // Usa um pequeno atraso para evitar sobrecarga do navegador
                                    setTimeout(() => {
                                        addMessage(msg.role || 'assistant', content, true);
                                    }, 10 * index);
                                }
                            }
                        } catch (e) {
                            console.error(`Erro ao processar mensagem ${index}:`, e, msg);
                        }
                    });
                    
                    scrollToBottom();
                }
            } catch (e) {
                console.error('Erro ao processar histórico:', e);
                // Se o histórico estiver corrompido, remove-o
                localStorage.removeItem(`chatHistory_${sessionId}`);
            }
        }
        
        // Se não houver mensagens no histórico, mostra a mensagem de boas-vindas
        if (!hasMessages) {
            console.log('Nenhum histórico válido encontrado, mostrando mensagem de boas-vindas');
            
            // Adiciona a mensagem de boas-vindas
            setTimeout(() => {
                addBotMessage("Olá! Meu nome é GerhAI! Estou aqui para te ajudar com o que precisar. Como posso te ajudar hoje?");
            }, 500);
        }
        
    }, 100); // Pequeno atraso para garantir que o DOM esteja pronto
}

// Mostra o estado vazio
function showEmptyState() {
    if (document.querySelector('.empty-state')) return;
    
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <i class="fas fa-comments text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Inicie uma conversa</h3>
        <p class="text-gray-600 dark:text-gray-400 text-center max-w-md">
            Digite uma mensagem para começar a conversar com o GerhAI.
            Você pode fazer perguntas sobre qualquer assunto!
        </p>
    `;
    
    chatMessages.appendChild(emptyState);
}

// Salva uma mensagem no histórico
function saveMessage(role, content) {
    // Garante que o conteúdo seja uma string
    if (typeof content !== 'string') {
        console.warn('Conteúdo da mensagem não é uma string, convertendo...', content);
        content = String(content || '');
    }
    
    // Remove espaços em branco e verifica se há conteúdo
    content = content.trim();
    if (!content) return; // Não salva mensagens vazias
    
    try {
        const history = JSON.parse(localStorage.getItem(`chatHistory_${sessionId}`) || '[]');
        
        // Garante que o histórico seja um array
        if (!Array.isArray(history)) {
            console.error('Histórico inválido, recriando...');
            localStorage.setItem(`chatHistory_${sessionId}`, JSON.stringify([]));
            return;
        }
        
        // Adiciona a mensagem ao histórico
        history.push({ 
            role: role || 'assistant', // Define um valor padrão para role
            content: content,
            timestamp: new Date().toISOString() // Adiciona timestamp para referência
        });
        
        // Limita o histórico a 100 mensagens para evitar armazenamento excessivo
        const MAX_HISTORY = 100;
        if (history.length > MAX_HISTORY) {
            history.splice(0, history.length - MAX_HISTORY);
        }
        
        localStorage.setItem(`chatHistory_${sessionId}`, JSON.stringify(history));
        
        // Remove o estado vazio se estiver visível
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) emptyState.remove();
    } catch (e) {
        console.error('Erro ao salvar mensagem no histórico:', e);
        // Em caso de erro, tenta limpar o histórico corrompido
        try {
            localStorage.setItem(`chatHistory_${sessionId}`, JSON.stringify([]));
        } catch (e) {
            console.error('Falha ao limpar histórico corrompido:', e);
        }
    }
}

// Limpa o histórico de mensagens
function clearChatHistory() {
    localStorage.removeItem(`chatHistory_${sessionId}`);
    chatMessages.innerHTML = '';
    showEmptyState();
    scrollToBottom();
}

// Adiciona uma mensagem ao chat
function addMessage(role, content, isFromHistory = false) {
    // Verifica se já existe uma mensagem de boas-vindas
    if (content && content.startsWith('Olá! Meu nome é GerhAI!')) {
        const existingWelcome = document.querySelector('.bot-message .message-content');
        if (existingWelcome && existingWelcome.textContent.includes('Olá! Meu nome é GerhAI!')) {
            console.log('Mensagem de boas-vindas já exibida, ignorando duplicação');
            return;
        }
    }
    
    // Garante que content seja uma string
    if (typeof content !== 'string') {
        console.error('O conteúdo da mensagem deve ser uma string:', content);
        content = String(content);
    }

    const message = content.trim();
    if (message === '') return;
    
    // Se for para carregar do histórico, não salva novamente
    if (!isFromHistory) {
        saveMessage(role, message);
    }
    
    // Remove o estado vazio se estiver visível
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role === 'user' ? 'user-message' : 'bot-message'}`;
    
    const messageInner = document.createElement('div');
    messageInner.className = 'message-inner';
    
    // Adiciona o avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = role === 'user' ? 
        '<i class="fas fa-user"></i>' : 
        '<i class="fas fa-robot"></i>';
    
    // Cria o conteúdo da mensagem
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = marked.parse(message);
    
    // Adiciona funcionalidade de copiar código para blocos de código
    const codeBlocks = contentDiv.querySelectorAll('pre code');
    codeBlocks.forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        const codeWrapper = document.createElement('div');
        codeWrapper.style.position = 'relative';
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.title = 'Copiar código';
        copyButton.innerHTML = '<i class="far fa-copy"></i>';
        copyButton.onclick = () => {
            navigator.clipboard.writeText(codeBlock.textContent);
            copyButton.innerHTML = '<i class="fas fa-check"></i>';
            copyButton.title = 'Copiado!';
            copyButton.classList.add('text-green-500');
            
            // Mostra notificação
            showNotification('Código copiado!', 'success');
            
            setTimeout(() => {
                copyButton.innerHTML = '<i class="far fa-copy"></i>';
                copyButton.title = 'Copiar código';
                copyButton.classList.remove('text-green-500');
            }, 2000);
        };
        
        // Envolve o pre no wrapper e adiciona o botão
        pre.parentNode.insertBefore(codeWrapper, pre);
        codeWrapper.appendChild(pre);
        codeWrapper.appendChild(copyButton);
    });
    
    messageInner.appendChild(avatar);
    messageInner.appendChild(contentDiv);
    messageDiv.appendChild(messageInner);
    
    if (!isFromHistory) {
        messageDiv.style.opacity = '0';
        chatMessages.appendChild(messageDiv);
        
        // Anima a entrada da mensagem
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        });
    } else {
        chatMessages.appendChild(messageDiv);
    }
    
    scrollToBottom();
    return messageDiv;
}

// Mostra o indicador de digitação
function showTypingIndicator() {
    // Remove qualquer indicador existente
    hideTypingIndicator();
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    const typingInner = document.createElement('div');
    typingInner.className = 'message bot-message';
    
    const messageInner = document.createElement('div');
    messageInner.className = 'message-inner';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar bot-avatar';
    const botIcon = document.createElement('i');
    botIcon.className = 'fas fa-robot';
    avatar.appendChild(botIcon);
    
    const typingContent = document.createElement('div');
    typingContent.className = 'typing-content';
    
    const typingText = document.createElement('div');
    typingText.className = 'typing-text';
    typingText.textContent = 'Digitando';
    
    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.className = 'typing-dot';
        dots.appendChild(dot);
    }
    
    typingContent.appendChild(typingText);
    typingContent.appendChild(dots);
    
    messageInner.appendChild(avatar);
    messageInner.appendChild(typingContent);
    typingInner.appendChild(messageInner);
    typingDiv.appendChild(typingInner);
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
    
    // Força uma nova renderização para a animação
    requestAnimationFrame(() => {
        typingDiv.style.opacity = '1';
        typingDiv.style.transform = 'translateY(0)';
    });
    
    return typingDiv;
}

// Remove o indicador de digitação
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.opacity = '0';
        typingIndicator.style.transform = 'translateY(10px)';
        setTimeout(() => {
            typingIndicator.remove();
        }, 300);
    }
}

// Mostra uma notificação
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`;
    
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.innerHTML = `${icon}<span>${message}</span>`;
    document.body.appendChild(notification);
    
    // Mostra a notificação
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Remove a notificação após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Função para rolar para a última mensagem
function scrollToBottom() {
    requestAnimationFrame(() => {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    });
}

// Função para auto-ajustar a altura do textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    
    // Limita a altura máxima
    if (textarea.scrollHeight > 200) {
        textarea.style.overflowY = 'auto';
    } else {
        textarea.style.overflowY = 'hidden';
    }
}

// Envia a mensagem para o servidor
async function sendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;
    
    // Adiciona a mensagem do usuário
    addMessage('user', message);
    
    // Limpa o input
    userInput.value = '';
    autoResize(userInput);
    
    // Desabilita o input e o botão
    userInput.disabled = true;
    sendButton.disabled = true;
    sendButton.classList.add('opacity-50', 'cursor-not-allowed');
    
    // Mostra o indicador de digitação
    showTypingIndicator();
    
    try {
        // Envia a mensagem para o servidor
        const response = await fetch('/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: message,
                session_id: sessionId
            }),
        });
        
        if (!response.ok) {
            throw new Error('Erro ao enviar mensagem');
        }
        
        const data = await response.json();
        
        // Atualiza o sessionId se necessário
        if (data.session_id) {
            sessionId = data.session_id;
            localStorage.setItem('chatSessionId', sessionId);
        }
        
        // Remove o indicador de digitação
        hideTypingIndicator();
        
        // Adiciona a resposta do bot
        if (data.response && data.response.trim() !== '') {
            addMessage('assistant', data.response);
        }
        
    } catch (error) {
        console.error('Erro:', error);
        hideTypingIndicator();
        showNotification('Erro ao enviar mensagem. Tente novamente.', 'error');
        addMessage('assistant', 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.');
    } finally {
        // Reabilita o input e o botão
        userInput.disabled = false;
        sendButton.disabled = false;
        sendButton.classList.remove('opacity-50', 'cursor-not-allowed');
        userInput.focus();
    }
}

// Função para alternar entre tema claro e escuro
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    
    // Atualiza o ícone do botão de tema
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Verifica a preferência de tema salva
function checkThemePreference() {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('darkMode');
    
    // Se não houver preferência salva, usa a preferência do sistema
    if (savedTheme === null) {
        if (prefersDarkScheme.matches) {
            document.documentElement.classList.add('dark');
        }
    } else if (savedTheme === 'true') {
        document.documentElement.classList.add('dark');
    }
    
    // Atualiza o ícone do botão de tema
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = document.documentElement.classList.contains('dark') ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Configura o botão de alternar tema
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Configura o auto-resize do textarea
    userInput.addEventListener('input', () => autoResize(userInput));

    // Configura o envio do formulário
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    // Configura o botão de limpar
    const clearButton = document.querySelector('.clear-button');
    if (clearButton) {
        clearButton.addEventListener('click', (e) => {
            e.preventDefault();
            userInput.value = '';
            autoResize(userInput);
            userInput.focus();
        });
    }

    // Configura o atalho Enter para enviar mensagem
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Rola para o final quando a janela é redimensionada
    window.addEventListener('resize', scrollToBottom);
    
    // Verifica a preferência de tema
    checkThemePreference();
    
    // Verifica se há histórico de mensagens
    const history = localStorage.getItem(`chatHistory_${sessionId}`);
    if (history) {
        // Se houver histórico, carrega as mensagens
        loadChatHistory();
    } else {
        // Se não houver histórico, mostra a mensagem de boas-vindas
        setTimeout(() => {
            addBotMessage("Olá! Meu nome é GerhAI! Estou aqui para te ajudar com o que precisar. Como posso te ajudar hoje?");
        }, 500);
    }
    
    // Foca no input quando a página carrega
    userInput.focus();
});
