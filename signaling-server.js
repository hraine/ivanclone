/**
 * Пример сервера сигнализации для Discord Clone
 * Используйте Node.js с пакетом ws
 * 
 * Установка: npm install ws
 * Запуск: node signaling-server.js
 */

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Хранилище подключенных пользователей
const users = new Map();
const messageQueue = new Map();

/**
 * Класс для отслеживания пользователя
 */
class User {
    constructor(id, ws) {
        this.id = id;
        this.ws = ws;
        this.connectedWith = new Set();
    }

    isOnline() {
        return this.ws.readyState === WebSocket.OPEN;
    }

    send(message) {
        if (this.isOnline()) {
            this.ws.send(JSON.stringify(message));
        }
    }

    sendToQueue(message) {
        if (!messageQueue.has(this.id)) {
            messageQueue.set(this.id, []);
        }
        messageQueue.get(this.id).push(message);
    }

    flushQueue() {
        const queue = messageQueue.get(this.id) || [];
        queue.forEach(msg => this.send(msg));
        messageQueue.delete(this.id);
    }
}

/**
 * Обработчик подключения WebSocket
 */
wss.on('connection', (ws) => {
    console.log('Новое подключение');
    let currentUser = null;

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMessage(message, ws, (user) => {
                currentUser = user;
            });
        } catch (error) {
            console.error('Ошибка парсинга сообщения:', error);
        }
    });

    ws.on('close', () => {
        if (currentUser) {
            console.log(`Пользователь ${currentUser.id} отключился`);
            users.delete(currentUser.id);

            // Уведомляем подключенных пользователей
            currentUser.connectedWith.forEach(userId => {
                const user = users.get(userId);
                if (user) {
                    user.send({
                        type: 'user-offline',
                        userId: currentUser.id
                    });
                    user.connectedWith.delete(currentUser.id);
                }
            });
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket ошибка:', error);
    });
});

/**
 * Обработка входящих сообщений
 */
function handleMessage(message, ws, setCurrentUser) {
    const { type } = message;

    switch (type) {
        case 'register':
            handleRegister(message, ws, setCurrentUser);
            break;

        case 'offer':
        case 'answer':
        case 'ice-candidate':
            handleSignaling(message);
            break;

        case 'call-end':
            handleCallEnd(message);
            break;

        case 'get-users':
            handleGetUsers(message, ws);
            break;

        case 'text-message':
            handleTextMessage(message);
            break;

        default:
            console.log('Неизвестный тип сообщения:', type);
    }
}

/**
 * Регистрирует пользователя
 */
function handleRegister(message, ws, setCurrentUser) {
    const { userId } = message;

    // Проверяем, не зарегистрирован ли уже этот пользователь
    if (users.has(userId)) {
        console.log(`Пользователь ${userId} уже существует, закрываем старое соединение`);
        users.get(userId).ws.close();
    }

    const user = new User(userId, ws);
    users.set(userId, user);
    setCurrentUser(user);

    console.log(`Пользователь ${userId} зарегистрирован. Всего: ${users.size}`);

    // Отправляем подтверждение
    user.send({
        type: 'registered',
        userId: userId,
        onlineUsers: Array.from(users.keys()).filter(id => id !== userId)
    });

    // Уведомляем других пользователей
    broadcastUserStatus('user-online', userId);

    // Отправляем очереди сообщений
    user.flushQueue();
}

/**
 * Обрабатывает сигнализационные сообщения (offer, answer, ice-candidate)
 */
function handleSignaling(message) {
    const { from, to, type } = message;

    const toUser = users.get(to);
    if (toUser) {
        if (toUser.isOnline()) {
            toUser.send(message);
            console.log(`${type} от ${from} отправлено ${to}`);
        } else {
            // Ставим в очередь, если пользователь оффлайн
            toUser.sendToQueue(message);
            console.log(`${type} от ${from} поставлено в очередь для ${to}`);
        }

        // Отслеживаем соединения
        const fromUser = users.get(from);
        if (fromUser && type === 'offer') {
            fromUser.connectedWith.add(to);
            toUser.connectedWith.add(from);
        }
    } else {
        console.log(`Пользователь ${to} не найден`);
    }
}

/**
 * Обрабатывает завершение вызова
 */
function handleCallEnd(message) {
    const { from, to } = message;

    const toUser = users.get(to);
    if (toUser && toUser.isOnline()) {
        toUser.send(message);
        console.log(`Вызов от ${from} завершен`);
    }

    // Удаляем соединения
    const fromUser = users.get(from);
    if (fromUser) {
        fromUser.connectedWith.delete(to);
    }
    if (toUser) {
        toUser.connectedWith.delete(from);
    }
}

/**
 * Получает список онлайн пользователей
 */
function handleGetUsers(message, ws) {
    const { userId } = message;
    const user = users.get(userId);

    if (user) {
        const onlineUsers = Array.from(users.keys())
            .filter(id => id !== userId && users.get(id).isOnline())
            .map(id => ({
                id: id,
                status: 'online'
            }));

        user.send({
            type: 'users-list',
            users: onlineUsers
        });
    }
}

/**
 * Обрабатывает текстовые сообщения
 */
function handleTextMessage(message) {
    const { from, to, text, timestamp } = message;

    const toUser = users.get(to);
    if (toUser) {
        if (toUser.isOnline()) {
            toUser.send({
                type: 'text-message',
                from: from,
                text: text,
                timestamp: timestamp
            });
            console.log(`Сообщение от ${from} отправлено ${to}`);
        } else {
            // Ставим в очередь, если пользователь оффлайн
            toUser.sendToQueue({
                type: 'text-message',
                from: from,
                text: text,
                timestamp: timestamp
            });
            console.log(`Сообщение от ${from} поставлено в очередь для ${to}`);
        }
    }
}

/**
 * Отправляет статус пользователя всем
 */
function broadcastUserStatus(type, userId) {
    const message = {
        type: type,
        userId: userId
    };

    users.forEach((user) => {
        if (user.id !== userId && user.isOnline()) {
            user.send(message);
        }
    });
}

/**
 * Периодически отправляет статистику
 */
setInterval(() => {
    const onlineCount = Array.from(users.values()).filter(u => u.isOnline()).length;
    console.log(`[${new Date().toLocaleTimeString()}] Онлайн: ${onlineCount} пользователей`);
}, 30000);

// Запуск сервера
server.listen(PORT, () => {
    console.log(`\n🚀 Сервер сигнализации запущен на http://localhost:${PORT}`);
    console.log(`🔗 WebSocket: ws://localhost:${PORT}`);
    console.log('\nСерверные команды:');
    console.log('- ctrl+c для остановки\n');
});

// Обработка завершения процесса
process.on('SIGINT', () => {
    console.log('\n\n🛑 Сервер остановлен');
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.close();
        }
    });
    server.close();
    process.exit(0);
});

/**
 * Глобальная обработка ошибок
 */
process.on('uncaughtException', (error) => {
    console.error('Необработанная ошибка:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Необработанное отклонение:', reason);
});
