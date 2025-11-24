# 📚 API Документация Discord Clone

## Общая информация

Это полная документация для Discord Clone - WebRTC приложения для голосовых и видеозвонков с текстовым чатом.

---

## 📋 Содержание

1. [Основные функции](#основные-функции)
2. [Структура данных](#структура-данных)
3. [JavaScript API](#javascript-api)
4. [WebRTC Signaling API](#webrtc-signaling-api)
5. [LocalStorage API](#localstorage-api)
6. [События](#события)

---

## 🎯 Основные функции

### Управление контактами

#### Добавление контакта

```javascript
// Сохранить контакт
const contact = {
    id: 'user_abc123def456',
    name: 'Иван Петров',
    avatar: 'https://example.com/avatar.jpg',
    status: 'online',
    lastMessage: 'Привет!',
    lastMessageTime: '2024-01-15T10:30:00Z'
};

storage.contacts.push(contact);
saveContacts();
loadContacts();
```

#### Получение контакта

```javascript
const contact = storage.contacts.find(c => c.id === 'user_id');
console.log(contact.name); // 'Иван Петров'
```

#### Удаление контакта

```javascript
storage.contacts = storage.contacts.filter(c => c.id !== contactId);
saveContacts();
loadContacts();
```

### Сообщения

#### Отправка сообщения

```javascript
const message = {
    id: Date.now(),
    from: currentUserId,
    to: contactId,
    text: 'Привет!',
    timestamp: new Date().toISOString(),
    type: 'text'
};

if (!storage.messages[contactId]) {
    storage.messages[contactId] = [];
}
storage.messages[contactId].push(message);
saveMessages();
loadMessages();
```

#### Получение сообщений

```javascript
const chatMessages = storage.messages[contactId] || [];
chatMessages.forEach(msg => {
    console.log(`${msg.from}: ${msg.text}`);
});
```

#### Поиск сообщений

```javascript
const searchResults = storage.messages[contactId].filter(msg => 
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
);
```

---

## 📊 Структура данных

### Contact Object

```javascript
{
    id: String,              // Уникальный ID пользователя
    name: String,            // Имя контакта
    avatar: String,          // URL аватара
    status: String,          // 'online' | 'offline' | 'idle' | 'dnd'
    lastMessage: String,     // Последнее сообщение
    lastMessageTime: String  // ISO 8601 timestamp
}
```

### Message Object

```javascript
{
    id: Number,              // Уникальный ID сообщения
    from: String,            // ID отправителя
    to: String,              // ID получателя
    text: String,            // Содержимое
    timestamp: String,       // ISO 8601 timestamp
    type: String             // 'text' | 'system' | 'call'
}
```

### Call Object

```javascript
{
    id: Number,
    from: String,
    to: String,
    startTime: String,       // ISO 8601 timestamp
    endTime: String,         // ISO 8601 timestamp
    duration: Number,        // В секундах
    type: String             // 'audio' | 'video'
}
```

---

## 🔧 JavaScript API

### Управление ID пользователя

```javascript
// Получить текущий ID
const userId = currentUserId;

// Генерировать новый ID
const newUserId = generateUserId();
// Результат: 'user_abc123def456'

// Скопировать ID
copyUserId(); // Копирует в буфер обмена
```

### Управление контактами

```javascript
// Открыть модальное окно добавления контакта
openAddChatModal();

// Закрыть модальное окно
closeAddChatModal();

// Добавить новый контакт
addNewContact();

// Загрузить контакты
loadContacts();

// Выбрать контакт
selectContact(contact);
```

### Управление сообщениями

```javascript
// Отправить сообщение
sendMessage();

// Загрузить сообщения чата
loadMessages();

// Создать элемент сообщения
const element = createMessageElement(message);

// Очистить HTML
const safe = escapeHtml(userInput);
```

### Видеозвонки

```javascript
// Инициировать видеозвонок
initiateVideoCall();

// Инициировать голосовой звонок
initiateVoiceCall();

// Запустить видеозвонок
await startVideoCall(withVideo);

// Имитировать удаленный поток
simulateRemoteStream();

// Переключить видео
toggleVideo();

// Переключить аудио
toggleAudio();

// Принять звонок
acceptCall();

// Отклонить звонок
declineCall();

// Завершить звонок
endCall();
```

---

## 🌐 WebRTC Signaling API

### Класс WebRTCSignaling

```javascript
const signaling = new WebRTCSignaling();
```

#### Инициализация

```javascript
await signaling.initialize(
    userId,
    'wss://server.example.com:8080'
);
```

#### Инициировать звонок

```javascript
signaling.initiateCall(remoteUserId, (stream) => {
    document.getElementById('remoteVideo').srcObject = stream;
});
```

#### Получить локальный поток

```javascript
const stream = signaling.getLocalStream();
document.getElementById('localVideo').srcObject = stream;
```

#### Переключить видео

```javascript
signaling.toggleVideo(true);  // Включить
signaling.toggleVideo(false); // Отключить
```

#### Переключить аудио

```javascript
signaling.toggleAudio(true);  // Включить
signaling.toggleAudio(false); // Отключить
```

#### Отправить сообщение через Data Channel

```javascript
signaling.sendDataChannelMessage(remoteUserId, {
    type: 'text',
    content: 'Привет!'
});
```

#### Завершить звонок

```javascript
signaling.endCall(remoteUserId);
```

#### Завершить все звонки

```javascript
signaling.endAllCalls();
```

---

## 💾 LocalStorage API

### Формат хранилища

```javascript
// Контакты
localStorage.getItem('discordClone_contacts')
// [{"id":"user_id","name":"Name",...}]

// Сообщения
localStorage.getItem('discordClone_messages')
// {"user_id":[{"id":1234567890,...}]}

// ID пользователя
localStorage.getItem('discordClone_userId')
// "user_abc123def456"
```

### Сохранение данных

```javascript
// Сохранить контакты
localStorage.setItem('discordClone_contacts', JSON.stringify(storage.contacts));

// Сохранить сообщения
localStorage.setItem('discordClone_messages', JSON.stringify(storage.messages));

// Сохранить ID
localStorage.setItem('discordClone_userId', currentUserId);
```

### Загрузка данных

```javascript
// Загрузить контакты
const contacts = JSON.parse(localStorage.getItem('discordClone_contacts')) || [];

// Загрузить сообщения
const messages = JSON.parse(localStorage.getItem('discordClone_messages')) || {};

// Загрузить ID
const userId = localStorage.getItem('discordClone_userId');
```

### Очистка данных

```javascript
// Очистить все
localStorage.clear();

// Очистить контакты
localStorage.removeItem('discordClone_contacts');

// Очистить сообщения
localStorage.removeItem('discordClone_messages');
```

---

## 📡 События

### Пользовательские события

#### Входящий звонок

```javascript
window.addEventListener('incomingCall', (event) => {
    const { userId } = event.detail;
    console.log(`Входящий звонок от ${userId}`);
});
```

#### Звонок завершен

```javascript
window.addEventListener('callEnded', (event) => {
    const { userId } = event.detail;
    console.log(`Звонок завершен с ${userId}`);
});
```

#### Сообщение из Data Channel

```javascript
window.addEventListener('datachannel-message', (event) => {
    const { type, content } = event.detail;
    console.log(`Сообщение: ${content}`);
});
```

### WebRTC События

#### Состояние соединения

```javascript
peerConnection.onconnectionstatechange = () => {
    switch(peerConnection.connectionState) {
        case 'new':
            console.log('Новое соединение');
            break;
        case 'connecting':
            console.log('Подключение...');
            break;
        case 'connected':
            console.log('Подключено');
            break;
        case 'disconnected':
            console.log('Отключено');
            break;
        case 'failed':
            console.log('Ошибка соединения');
            break;
        case 'closed':
            console.log('Соединение закрыто');
            break;
    }
};
```

#### Поток видео

```javascript
peerConnection.ontrack = (event) => {
    console.log('Получен поток:', event.streams);
    document.getElementById('remoteVideo').srcObject = event.streams[0];
};
```

#### ICE кандидаты

```javascript
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        console.log('Новый ICE кандидат:', event.candidate);
        sendToServer({
            type: 'ice-candidate',
            candidate: event.candidate
        });
    }
};
```

---

## 🔌 Signaling Server API

### Сообщения от клиента

#### Register

```json
{
    "type": "register",
    "userId": "user_abc123"
}
```

**Ответ:**
```json
{
    "type": "registered",
    "userId": "user_abc123",
    "onlineUsers": ["user_xyz", "user_123"]
}
```

#### Offer

```json
{
    "type": "offer",
    "from": "user_abc",
    "to": "user_def",
    "sdp": "v=0\r\no=..."
}
```

#### Answer

```json
{
    "type": "answer",
    "from": "user_def",
    "to": "user_abc",
    "sdp": "v=0\r\no=..."
}
```

#### ICE Candidate

```json
{
    "type": "ice-candidate",
    "from": "user_abc",
    "to": "user_def",
    "candidate": "candidate:123456...",
    "sdpMLineIndex": 0,
    "sdpMid": "0"
}
```

#### Call End

```json
{
    "type": "call-end",
    "from": "user_abc",
    "to": "user_def"
}
```

#### Get Users

```json
{
    "type": "get-users",
    "userId": "user_abc"
}
```

**Ответ:**
```json
{
    "type": "users-list",
    "users": [
        {"id": "user_xyz", "status": "online"},
        {"id": "user_123", "status": "online"}
    ]
}
```

#### Text Message

```json
{
    "type": "text-message",
    "from": "user_abc",
    "to": "user_def",
    "text": "Привет!",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔐 Безопасность

### Валидация данных

```javascript
// Проверка ID
function isValidUserId(id) {
    return /^user_[a-z0-9]{9}$/.test(id);
}

// Проверка сообщения
function isValidMessage(text) {
    return text && text.length > 0 && text.length < 4000;
}

// Проверка имени
function isValidName(name) {
    return name && name.length > 0 && name.length < 100;
}
```

### Шифрование

Для шифрования переходящих данных используйте:

```javascript
// Асимметричное шифрование (TweetNaCl.js)
// npm install tweetnacl tweetnacl-util

const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

const keyPair = nacl.box.keyPair();
```

---

## 📝 Примеры кода

### Пример: Создание приложения

```javascript
// 1. Инициализируем хранилище
const storage = {
    contacts: [],
    messages: {},
    userId: generateUserId()
};

// 2. Добавляем контакт
const newContact = {
    id: 'user_contact123',
    name: 'Друг',
    status: 'online',
    avatar: 'https://example.com/avatar.jpg'
};
storage.contacts.push(newContact);

// 3. Отправляем сообщение
const message = {
    id: Date.now(),
    from: storage.userId,
    to: newContact.id,
    text: 'Привет! Как дела?',
    timestamp: new Date().toISOString(),
    type: 'text'
};

// 4. Сохраняем
saveContacts();
saveMessages();
```

### Пример: WebRTC вызов

```javascript
// 1. Инициализируем
const signaling = new WebRTCSignaling();
await signaling.initialize(currentUserId, signalingServerUrl);

// 2. Инициируем вызов
await signaling.initiateCall(remoteUserId, (remoteStream) => {
    document.getElementById('remoteVideo').srcObject = remoteStream;
});

// 3. Обработка входящих вызовов
window.addEventListener('incomingCall', async (event) => {
    await signaling.initiateCall(event.detail.userId);
});

// 4. Завершение вызова
signaling.endCall(remoteUserId);
```

---

## ❌ Обработка ошибок

### Примеры ошибок

```javascript
try {
    await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    });
} catch (error) {
    if (error.name === 'NotAllowedError') {
        console.error('Доступ к камере/микрофону запрещен');
    } else if (error.name === 'NotFoundError') {
        console.error('Камера/микрофон не найдены');
    } else if (error.name === 'NotReadableError') {
        console.error('Не удается получить доступ к устройству');
    }
}
```

---

## 📞 Поддержка

- 📧 Email: support@example.com
- 💬 GitHub Issues: https://github.com/example/discord-clone/issues
- 📚 Документация: https://example.com/docs

---

**Версия:** 1.0.0  
**Последнее обновление:** 2024-01-15
