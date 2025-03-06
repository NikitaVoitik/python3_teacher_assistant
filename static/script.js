let currentMode = 'Socratic Approach';

function setMode(mode, iconUrl) {
    currentMode = mode;
    document.getElementById('mode-icon').src = iconUrl;
}

function sendMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    if (userInput === '') return;

    const chatWindow = document.getElementById('chat-window');
    const userMessageContainer = document.createElement('div');
    userMessageContainer.className = 'message-container user';
    const userMessage = document.createElement('div');
    userMessage.className = 'user-message';
    userMessage.textContent = userInput;
    userMessageContainer.appendChild(userMessage);
    chatWindow.appendChild(userMessageContainer);

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    chatWindow.appendChild(typingIndicator);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    fetch('/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({message: userInput, prompt_type: currentMode})
    })
        .then(response => response.json())
        .then(data => {
            chatWindow.removeChild(typingIndicator);
            const llmMessageContainer = document.createElement('div');
            llmMessageContainer.className = 'message-container';
            const llmResponse = document.createElement('div');
            llmResponse.className = 'llm-response';
            llmResponse.innerHTML = formatResponse(data.response);
            llmMessageContainer.appendChild(llmResponse);
            chatWindow.appendChild(llmMessageContainer);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        });

    document.getElementById('user-input').value = '';
    document.getElementById('user-input').style.height = 'auto'; // Reset height
}

function resetHistory() {
    let messages = document.querySelectorAll('.message-container');
    messages.forEach(message => {
        message.remove();
    });
    fetch('/reset', {
        method: 'POST'
    });
}

function autoGrow(element) {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
}

function formatResponse(response) {
    // Replace **text** with <b>text</b>
    response = response.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Replace \n with <br>
    response = response.replace(/\n/g, '<br>');
    return response;
}

// File drag and drop functionality
function initFileDragDrop() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('file-info');

    // Open file dialog when clicking on drop area
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection from dialog
    fileInput.addEventListener('change', handleFiles);

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    document.getElementById('drop-area').classList.add('highlight');
}

function unhighlight() {
    document.getElementById('drop-area').classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(e) {
    const files = e.target ? e.target.files : e;
    const fileInfo = document.getElementById('file-info');

    if (files.length === 0) return;

    const file = files[0];

    // Define allowed file types
    const allowedTypes = [
        'text/plain', 'text/html', 'text/css', 'text/javascript',
        'application/json', 'application/xml', 'application/javascript',
        'text/x-python', 'text/x-java', 'text/x-c', 'text/x-c++',
        'text/markdown', 'text/x-typescript'
    ];

    // Check file extension as fallback
    const validExtensions = ['.txt', '.js', '.py', '.html', '.css', '.json', '.xml',
        '.md', '.ts', '.jsx', '.tsx', '.java', '.c', '.cpp',
        '.h', '.cs', '.php', '.rb', '.go', '.rs', '.swift'];

    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        fileInfo.textContent = `Error: Only text and code files are allowed`;
        return;
    }

    fileInfo.textContent = `File: ${file.name} (${formatFileSize(file.size)})`;
    uploadFile(file);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const fileInfo = document.getElementById('file-info');

    const chatWindow = document.getElementById('chat-window');
    const userMessageContainer = document.createElement('div');
    userMessageContainer.className = 'message-container user';
    const userMessage = document.createElement('div');
    userMessage.className = 'user-message';
    userMessage.textContent = `Uploaded file: ${file.name}`;
    userMessageContainer.appendChild(userMessage);
    chatWindow.appendChild(userMessageContainer);

    fetch('/file', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                fileInfo.textContent = `File uploaded successfully: ${file.name}`;
            } else {
                fileInfo.textContent = 'Error uploading file';
            }
        })
        .catch(error => {
            fileInfo.textContent = 'Error: ' + error;
        });
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initFileDragDrop();

    document.getElementById('user-input').addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
});