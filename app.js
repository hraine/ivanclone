// ============================================
// Discord Clone - Основной скрипт
// ============================================

// Генерируем уникальный ID для пользователя
const currentUserId = generateUserId();
let localStream = null;
let peerConnection = null;
let currentChatId = null;
let currentRemoteUserId = null;
let isAudioEnabled = true;
let isVideoEnabled = true;

// WebRTC конфигурация
const rtcConfig = {
    iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] }
    ]
};

// Хранилище контактов и сообщений
const storage = {
    contacts: JSON.parse(localStorage.getItem('discordClone_contacts')) || [],
    messages: JSON.parse(localStorage.getItem('discordClone_messages')) || {},
    userId: currentUserId
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Отображаем ID пользователя
    document.getElementById('yourId').textContent = currentUserId;

    // Добавляем обработчики событий
    document.getElementById('addChatBtn').addEventListener('click', openAddChatModal);
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    document.getElementById('callBtn').addEventListener('click', initiateVideoCall);
    document.getElementById('voiceCallBtn').addEventListener('click', initiateVoiceCall);
    document.getElementById('toggleVideo').addEventListener('click', toggleVideo);
    document.getElementById('toggleAudio').addEventListener('click', toggleAudio);

    // Отображаем сохраненные контакты
    loadContacts();

    // Имитируем получение сообщений от других пользователей
    simulateIncomingMessages();
}

// ============================================
// Функции управления контактами
// ============================================

function generateUserId() {
    let userId = localStorage.getItem('discordClone_userId');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('discordClone_userId', userId);
    }
    return userId;
}

function openAddChatModal() {
    document.getElementById('addChatModal').classList.remove('hidden');
    document.getElementById('contactName').focus();
}

function closeAddChatModal() {
    document.getElementById('addChatModal').classList.add('hidden');
    document.getElementById('contactName').value = '';
    document.getElementById('contactId').value = '';
}

function addNewContact() {
    const contactName = document.getElementById('contactName').value.trim();
    const contactId = document.getElementById('contactId').value.trim();

    if (!contactName || !contactId) {
        alert('Пожалуйста, заполните все поля');
        return;
    }

    if (contactId === currentUserId) {
        alert('Вы не можете добавить себя!');
        return;
    }

    const existingContact = storage.contacts.find(c => c.id === contactId);
    if (existingContact) {
        alert('Этот контакт уже добавлен');
        return;
    }

    const contact = {
        id: contactId,
        name: contactName,
        avatar: `https://via.placeholder.com/40?text=${contactName.charAt(0).toUpperCase()}`,
        status: 'offline',
        lastMessage: '',
        lastMessageTime: new Date().toISOString()
    };

    storage.contacts.push(contact);
    saveContacts();
    loadContacts();
    closeAddChatModal();
}

function loadContacts() {
    const channelsList = document.getElementById('channelsList');
    channelsList.innerHTML = '';

    if (storage.contacts.length === 0) {
        channelsList.innerHTML = '<div style="padding: 16px; color: #72767d; font-size: 12px; text-align: center;">Нет контактов. Нажмите "+" чтобы добавить.</div>';
        return;
    }

    storage.contacts.forEach(contact => {
        const channelEl = document.createElement('div');
        channelEl.className = 'channel';
        if (currentChatId === contact.id) {
            channelEl.classList.add('active');
        }

        channelEl.innerHTML = `
            <img src="${contact.avatar}" alt="${contact.name}" class="channel-avatar">
            <div class="channel-info">
                <span class="channel-name">${contact.name}</span>
                <span class="channel-status">
                    <span class="status ${contact.status}">&bull;</span>${contact.status === 'online' ? 'Онлайн' : 'Офлайн'}
                </span>
            </div>
        `;

        channelEl.addEventListener('click', () => selectContact(contact));

        channelsList.appendChild(channelEl);
    });
}

function selectContact(contact) {
    currentChatId = contact.id;
    currentRemoteUserId = contact.id;

    // Обновляем активный чат
    document.querySelectorAll('.channel').forEach(ch => {
        ch.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Обновляем заголовок
    document.getElementById('chatName').textContent = contact.name;
    document.getElementById('userStatus').textContent = contact.status === 'online' ? 'онлайн' : 'офлайн';

    // Загружаем сообщения
    loadMessages();
}

function saveContacts() {
    localStorage.setItem('discordClone_contacts', JSON.stringify(storage.contacts));
}

// ============================================
// Функции управления сообщениями
// ============================================

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();

    if (!messageText || !currentChatId) {
        return;
    }

    if (!storage.messages[currentChatId]) {
        storage.messages[currentChatId] = [];
    }

    const message = {
        id: Date.now(),
        from: currentUserId,
        to: currentChatId,
        text: messageText,
        timestamp: new Date().toISOString(),
        type: 'text'
    };

    storage.messages[currentChatId].push(message);
    saveMessages();

    messageInput.value = '';
    loadMessages();

    // Имитируем получение ответного сообщения
    setTimeout(() => {
        simulateReply(currentChatId);
    }, 1000 + Math.random() * 2000);
}

function loadMessages() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '';

    const chatMessages = storage.messages[currentChatId] || [];

    if (chatMessages.length === 0) {
        messagesContainer.innerHTML = '<div class="system-message">Нет сообщений. Напишите первым!</div>';
        return;
    }

    chatMessages.forEach(message => {
        const messageEl = createMessageElement(message);
        messagesContainer.appendChild(messageEl);
    });

    // Прокручиваем вниз
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function createMessageElement(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    
    if (message.from === currentUserId) {
        messageEl.classList.add('own');
    }

    const contact = storage.contacts.find(c => c.id === message.from);
    const senderName = message.from === currentUserId ? 'Вы' : (contact ? contact.name : 'Неизвестный');
    const senderAvatar = message.from === currentUserId ? 
        'https://via.placeholder.com/40?text=You' : 
        (contact ? contact.avatar : 'https://via.placeholder.com/40');

    const time = new Date(message.timestamp);
    const timeStr = time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    messageEl.innerHTML = `
        <img src="${senderAvatar}" alt="${senderName}" class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${senderName}</span>
                <span class="message-timestamp">${timeStr}</span>
            </div>
            <div class="message-text">${escapeHtml(message.text)}</div>
        </div>
    `;

    return messageEl;
}

function saveMessages() {
    localStorage.setItem('discordClone_messages', JSON.stringify(storage.messages));
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// Имитация сообщений
// ============================================

function simulateIncomingMessages() {
    // Обновляем статус контактов
    setInterval(() => {
        storage.contacts.forEach(contact => {
            contact.status = Math.random() > 0.5 ? 'online' : 'offline';
        });
        loadContacts();
    }, 5000);
}

function simulateReply(chatId) {
    const contact = storage.contacts.find(c => c.id === chatId);
    if (!contact) return;

    const replies = [
        'Привет! Как дела? 👋',
        'Согласен! 👍',
        'Интересная идея 💡',
        'Спасибо за сообщение! ✨',
        'Давай позвоним? 📞',
        'Отлично! Когда?',
        'Я согласен 😊',
        'Звучит хорошо! 🎉',
        'Спасибо, тебе тоже! 🙏',
        'Давай встретимся позже 💬'
    ];

    const randomReply = replies[Math.floor(Math.random() * replies.length)];

    if (!storage.messages[chatId]) {
        storage.messages[chatId] = [];
    }

    const message = {
        id: Date.now(),
        from: chatId,
        to: currentUserId,
        text: randomReply,
        timestamp: new Date().toISOString(),
        type: 'text'
    };

    storage.messages[chatId].push(message);
    saveMessages();

    if (currentChatId === chatId) {
        loadMessages();
    }
}

// ============================================
// Видеозвонки
// ============================================

function initiateVideoCall() {
    if (!currentChatId) {
        alert('Выберите контакт');
        return;
    }

    startVideoCall(true);
}

function initiateVoiceCall() {
    if (!currentChatId) {
        alert('Выберите контакт');
        return;
    }

    startVideoCall(false);
}

async function startVideoCall(withVideo) {
    try {
        const constraints = {
            audio: true,
            video: withVideo ? { width: 1280, height: 720 } : false
        };

        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById('localVideo').srcObject = localStream;

        // Показываем модальное окно звонка
        document.getElementById('callModal').classList.remove('hidden');
        const contact = storage.contacts.find(c => c.id === currentChatId);
        if (contact) {
            document.getElementById('callUserName').textContent = `Звонок: ${contact.name}`;
        }

        // Имитируем установку соединения
        simulateRemoteStream();

        // Имитируем входящий звонок для другого пользователя
        setTimeout(() => {
            simulateIncomingCall();
        }, 500);

    } catch (error) {
        console.error('Ошибка доступа к камере/микрофону:', error);
        alert('Нет доступа к камере или микрофону');
    }
}

function simulateRemoteStream() {
    // Создаем синтетический видеопоток для демонстрации
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    // Рисуем аватар контакта
    const contact = storage.contacts.find(c => c.id === currentChatId);
    
    function drawFrame() {
        // Градиент фона
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Текст
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(contact?.name || 'Собеседник', canvas.width / 2, canvas.height / 2 - 50);

        ctx.font = '30px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('Видеозвонок', canvas.width / 2, canvas.height / 2 + 50);
    }

    drawFrame();
    const remoteVideo = document.getElementById('remoteVideo');
    remoteVideo.srcObject = canvas.captureStream(30);
}

function simulateIncomingCall() {
    const contact = storage.contacts.find(c => c.id === currentChatId);
    if (!contact) return;

    // Показываем уведомление о входящем звонке
    console.log(`Входящий звонок от ${contact.name}`);
}

function toggleVideo() {
    const button = document.getElementById('toggleVideo');
    const videoTrack = localStream?.getVideoTracks()[0];

    if (videoTrack) {
        isVideoEnabled = !isVideoEnabled;
        videoTrack.enabled = isVideoEnabled;
        button.classList.toggle('disabled', !isVideoEnabled);
    }
}

function toggleAudio() {
    const button = document.getElementById('toggleAudio');
    const audioTrack = localStream?.getAudioTracks()[0];

    if (audioTrack) {
        isAudioEnabled = !isAudioEnabled;
        audioTrack.enabled = isAudioEnabled;
        button.classList.toggle('disabled', !isAudioEnabled);
    }
}

function acceptCall() {
    document.getElementById('incomingCallModal').classList.add('hidden');
}

function declineCall() {
    document.getElementById('incomingCallModal').classList.add('hidden');
}

function endCall() {
    // Останавливаем поток
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    // Закрываем модальные окна
    document.getElementById('callModal').classList.add('hidden');
    document.getElementById('incomingCallModal').classList.add('hidden');

    // Сбрасываем видео
    document.getElementById('localVideo').srcObject = null;
    document.getElementById('remoteVideo').srcObject = null;

    // Сбрасываем кнопки
    document.getElementById('toggleVideo').classList.remove('disabled');
    document.getElementById('toggleAudio').classList.remove('disabled');
    isVideoEnabled = true;
    isAudioEnabled = true;

    // Добавляем системное сообщение
    if (currentChatId) {
        if (!storage.messages[currentChatId]) {
            storage.messages[currentChatId] = [];
        }

        storage.messages[currentChatId].push({
            id: Date.now(),
            from: 'system',
            text: '📞 Звонок завершен',
            timestamp: new Date().toISOString(),
            type: 'system'
        });

        saveMessages();
        loadMessages();
    }
}

// ============================================
// Утилиты
// ============================================

function copyUserId() {
    const userId = document.getElementById('yourId').textContent;
    navigator.clipboard.writeText(userId).then(() => {
        const btn = document.querySelector('.btn-copy');
        const originalText = btn.textContent;
        btn.textContent = 'Скопировано!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}

// Обработка закрытия модальных окон при клике вне области
window.addEventListener('click', (e) => {
    const addChatModal = document.getElementById('addChatModal');
    if (e.target === addChatModal) {
        closeAddChatModal();
    }
});

// ============================================
// Service Worker для offline функциональности
// ============================================

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('Service Worker не зарегистрирован:', err);
    });
}
