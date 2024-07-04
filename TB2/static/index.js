const chatHistory = {};
const prompts = [];

function generateNewPrompt() {
    const newPrompt = `Chat ${prompts.length + 1}`;
    prompts.push(newPrompt);
    chatHistory[newPrompt] = [];
    document.getElementById('chat-box').setAttribute('data-prompt', newPrompt);
    clearChatBox();
    updatePrompts();
    return newPrompt;
}

async function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() === '') return;

    let prompt = document.getElementById('chat-box').getAttribute('data-prompt');
    if (!prompt) {
        prompt = generateNewPrompt();
    }

    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<div class="chat-message user">
        <div class="message-text">${userInput}</div>
    </div>`;

    const response = await fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userInput })
    });

    const data = await response.json();
    chatBox.innerHTML += `<div class="chat-message bot">
        <div class="message-text">${data.response}</div>
    </div>`;

    document.getElementById('user-input').value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

            // Update history
    const timestamp = new Date().toLocaleTimeString();
    chatHistory[prompt].push({
        author: 'You',
        text: userInput,
        timestamp: timestamp
    });
    chatHistory[prompt].push({
        author: 'Bot',
        text: data.response,
        timestamp: timestamp
    });

    updateHistory(prompt);
}

function updateHistory(prompt) {
    const historyBox = document.getElementById('history-box');
    historyBox.innerHTML = '';
    if (chatHistory[prompt]) {
        chatHistory[prompt].forEach(item => {
            historyBox.innerHTML += `<div class="history-item">
                <div class="history-text">${item.author}: ${item.text}</div>
                <div class="timestamp">${item.timestamp}</div>
            </div>`;
        });
    }
    updatePrompts();
}

function saveChatHistory(prompt) {
    let historyText = '';

    if (chatHistory[prompt]) {
        chatHistory[prompt].forEach(item => {
            historyText += `${item.author}: ${item.text}\n`;
        });
    }

    const blob = new Blob([historyText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_history_${prompt}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function updatePrompts() {
    const historyBox = document.getElementById('history-box');
    historyBox.innerHTML = '';
    prompts.forEach((prompt, index) => {
        historyBox.innerHTML += `<div class="history-item">
            <div class="history-text" onclick="loadPrompt(${index})">${prompt}</div>
            <div class="prompt-options">
                <button class="icon-button" onclick="togglePromptMenu(${index})"><i class="fas fa-ellipsis-v"></i></button>
                <div class="prompt-menu" id="prompt-menu-${index}">
                    <button onclick="editPrompt(${index})">Edit</button>
                    <button onclick="saveChatHistory('${prompt}')">Save</button>
                    <button onclick="deletePrompt(${index})">Delete</button>
                        </div>
                    </div>
                </div>`;
            });
        }

function loadPrompt(index) {
    const prompt = prompts[index];
    document.getElementById('chat-box').setAttribute('data-prompt', prompt);
    clearChatBox();
    if (chatHistory[prompt]) {
        chatHistory[prompt].forEach(item => {
            const messageClass = item.author.toLowerCase() === 'you' ? 'user' : 'bot';
            document.getElementById('chat-box').innerHTML += `<div class="chat-message ${messageClass}">
                <div class="message-text">${item.text}</div>
            </div>`;
        });
    }
    document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;
        
            // Tambahkan kelas active-prompt ke elemen prompt yang sedang dilihat
    const promptElements = document.querySelectorAll('.history-text');
    promptElements.forEach((element, idx) => {
        if (idx === index) {
            element.classList.add('active-prompt');
        } else {
            element.classList.remove('active-prompt');
        }
    });
}
        

function clearChatBox() {
    document.getElementById('chat-box').innerHTML = '';
}

function editPrompt(index) {
    const oldPrompt = prompts[index];
    const newName = prompt("Enter new prompt name:", oldPrompt);
    if (newName && newName.trim() !== '' && newName !== oldPrompt) {
        prompts[index] = newName;
                // Update chatHistory with the new prompt name
        chatHistory[newName] = chatHistory[oldPrompt];
        delete chatHistory[oldPrompt];

                // If the current chat box is showing the old prompt, update it to the new prompt
        const chatBox = document.getElementById('chat-box');
        if (chatBox.getAttribute('data-prompt') === oldPrompt) {
            chatBox.setAttribute('data-prompt', newName);
            loadPrompt(index);
        }
                
        updatePrompts();
    }
}

function deletePrompt(index) {
    const promptToDelete = prompts[index];
    delete chatHistory[promptToDelete];
    prompts.splice(index, 1);
    updatePrompts();
    if (document.getElementById('chat-box').getAttribute('data-prompt') === promptToDelete) {
        document.getElementById('chat-box').setAttribute('data-prompt', '');
        clearChatBox();
    }
}

function togglePromptMenu(index) {
    const menu = document.getElementById(`prompt-menu-${index}`);
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

document.addEventListener('click', function(event) {
    const menus = document.querySelectorAll('.prompt-menu');
    menus.forEach(menu => {
        if (!menu.contains(event.target) && !menu.previousElementSibling.contains(event.target)) {
            menu.style.display = 'none';
        }
    });
});