let currentMode = 'Socratic Approach';
let dragCounter = 0;

function setMode(mode, iconUrl) {
    currentMode = mode;
    document.getElementById('mode-icon').src = iconUrl;
}

function selectMode(mode, iconUrl) {
    setMode(mode, iconUrl);
    document.getElementById('mode-modal').style.display = 'none';
}

function sendMessage() {
    if (currentMode === '') {
        alert('Please select a mode first.');
        return;
    }

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
        method: 'POST', headers: {
            'Content-Type': 'application/json'
        }, body: JSON.stringify({message: userInput, prompt_type: currentMode})
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

    // Open file dialog when clicking on drop area
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection from dialog
    fileInput.addEventListener('change', handleFileSelect);

    // Global drag and drop events
    window.addEventListener('dragenter', (event) => {
        event.preventDefault();
        dragCounter++;
        dropArea.style.display = 'flex';
    });

    window.addEventListener('dragleave', (event) => {
        event.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            dropArea.style.display = 'none';
        }
    });

    window.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    window.addEventListener('drop', (event) => {
        event.preventDefault();
        dragCounter = 0;
        dropArea.style.display = 'none';
        // Handle file drop
        const files = event.dataTransfer.files;
        handleFiles(files);
    });
}

function handleFileSelect(event) {
    const files = event.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    const fileInfo = document.getElementById('file-info');
    fileInfo.innerHTML = '';
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileElement = document.createElement('div');
        fileElement.textContent = `File: ${file.name}`;
        fileInfo.appendChild(fileElement);
        uploadFile(file);
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes'; else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'; else return (bytes / 1048576).toFixed(1) + ' MB';
}

function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const fileInfo = document.getElementById('file-info');
    const uploadStatus = document.createElement('div');
    uploadStatus.textContent = `Uploading ${file.name}...`;
    fileInfo.appendChild(uploadStatus);

    fetch('/file', {
        method: 'POST', body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                uploadStatus.textContent = `File ${file.name} uploaded successfully.`;
                displayFileMessage(file.name);
            } else {
                uploadStatus.textContent = `File ${file.name} upload failed.`;
            }
        })
        .catch(error => {
            uploadStatus.textContent = `Error uploading file ${file.name}: ${error}`;
        });
}

function displayFileMessage(fileName) {
    const chatWindow = document.getElementById('chat-window');
    const userMessageContainer = document.createElement('div');
    userMessageContainer.className = 'message-container user';
    const userMessage = document.createElement('div');
    userMessage.className = 'user-message file-message';
    const fileIcon = document.createElement('img');
    fileIcon.src = '/static/logos/file.svg';
    fileIcon.alt = 'File';
    fileIcon.className = 'file-icon';
    const fileNameElement = document.createElement('span');
    fileNameElement.textContent = fileName;
    userMessage.appendChild(fileIcon);
    userMessage.appendChild(fileNameElement);
    userMessageContainer.appendChild(userMessage);
    chatWindow.appendChild(userMessageContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
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

    // Show the mode selection modal on page load
    document.getElementById('mode-modal').style.display = 'flex';
});