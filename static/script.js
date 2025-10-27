const chatContainer = document.getElementById('chat-container');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Configuração do marked.js
marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function(code, lang) {
        // Você pode adicionar suporte a syntax highlighting aqui
        return code;
    }
});

// Adiciona a mensagem inicial do bot
window.onload = function() {
    addBotMessage("Olá! Meu nome é GerhAI! Estou aqui para te ajudar com o que precisar. Como posso te ajudar hoje?");
};

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

async function addMessage(message, isUser) {
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

function addBotMessage(message) {
    addMessage(message, false);
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
    
    // Adiciona a mensagem do usuário
    await addMessage(message, true);
    
    // Limpa o input e ajusta a altura
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Rola para a última mensagem
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    try {
        const response = await fetch('/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: message })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao enviar mensagem');
        }
        
        const data = await response.json();
        await addMessage(data.response, false);
        
    } catch (error) {
        console.error('Erro:', error);
        await addMessage('❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.', false);
    } finally {
        // Reabilita o input e botão
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}
