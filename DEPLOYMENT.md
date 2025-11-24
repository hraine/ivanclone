# 🚀 Развертывание Discord Clone

## Быстрый старт (Локально)

### 1. Простой запуск

Откройте терминал в папке проекта и выберите один из способов:

**Python 3:**
```bash
python -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Node.js:**
```bash
npx http-server -p 8000
```

Затем откройте http://localhost:8000 в браузере.

---

## Для реального использования (с видеозвонками)

### Требования

- Node.js 12+
- npm или yarn
- Открытый порт (3000 для фронта, 8080 для сервера)

### Установка сервера

1. Создайте папку для сервера:
```bash
mkdir discord-clone-server
cd discord-clone-server
```

2. Инициализируйте проект:
```bash
npm init -y
```

3. Установите зависимости:
```bash
npm install ws express cors
```

4. Скопируйте файл `signaling-server.js` в эту папку

5. Запустите сервер:
```bash
node signaling-server.js
```

Сервер будет доступен на `ws://localhost:8080`

### Запуск фронтенда

В отдельном терминале (в папке discord-clone):
```bash
npx http-server -p 3000
```

Откройте http://localhost:3000

---

## Развертывание на Heroku

### 1. Подготовка

Создайте `Procfile`:
```
web: node signaling-server.js
```

Создайте `package.json`:
```json
{
  "name": "discord-clone-server",
  "version": "1.0.0",
  "description": "WebRTC Signaling Server",
  "main": "signaling-server.js",
  "scripts": {
    "start": "node signaling-server.js"
  },
  "dependencies": {
    "ws": "^8.5.0",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

### 2. Развертывание

```bash
# Инициализируем git репозиторий
git init
git add .
git commit -m "Initial commit"

# Логинимся в Heroku
heroku login

# Создаем приложение
heroku create ваше-приложение-name

# Развертываем
git push heroku main
```

### 3. Обновите URL в приложении

В `app.js` обновите URL сервера:
```javascript
const signalingServerUrl = 'wss://ваше-приложение-name.herokuapp.com';
```

---

## Развертывание на AWS

### EC2 Instance

1. **Создайте EC2 инстанс** (Ubuntu 20.04 LTS)

2. **Подключитесь к инстансу**:
```bash
ssh -i "ваш-ключ.pem" ubuntu@ваш-ip-адрес
```

3. **Установите Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Клонируйте проект**:
```bash
git clone ваш-репозиторий
cd discord-clone
npm install
```

5. **Установите PM2** (для запуска в фоне):
```bash
sudo npm install -g pm2
pm2 start signaling-server.js --name "discord-signaling"
pm2 startup
pm2 save
```

6. **Сконфигурируйте Nginx** как обратный прокси:
```bash
sudo apt-get install nginx
sudo systemctl start nginx
```

---

## Развертывание на DigitalOcean

### 1. Создайте Droplet

- Выберите Ubuntu 20.04 LTS
- Размер: 512 MB / 1 GB RAM достаточно
- Добавьте SSH ключ

### 2. Подключитесь и установите

```bash
ssh root@ваш-ip-адрес

# Обновите систему
apt update && apt upgrade -y

# Установите Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
apt-get install -y nodejs

# Установите Git
apt-get install -y git

# Клонируйте проект
git clone ваш-репозиторий
cd discord-clone
npm install

# Установите PM2
npm install -g pm2
pm2 start signaling-server.js
pm2 startup
pm2 save
```

### 3. Настройте SSL сертификат

```bash
apt-get install -y certbot python3-certbot-nginx
certbot certonly --standalone -d ваш-домен.com
```

---

## Docker развертывание

### 1. Создайте `Dockerfile`:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY signaling-server.js .

EXPOSE 8080

CMD ["node", "signaling-server.js"]
```

### 2. Создайте `.dockerignore`:

```
node_modules
.git
.gitignore
README.md
```

### 3. Постройте и запустите:

```bash
# Постройте образ
docker build -t discord-clone-server .

# Запустите контейнер
docker run -p 8080:8080 discord-clone-server
```

### 4. Docker Compose (рекомендуется):

Создайте `docker-compose.yml`:

```yaml
version: '3.8'

services:
  signaling-server:
    build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
    restart: unless-stopped

  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./:/usr/share/nginx/html:ro
    restart: unless-stopped
```

Запуск:
```bash
docker-compose up -d
```

---

## Настройка DNS

1. **Укажите IP сервера** в DNS записях вашего домена:
```
A запись: ваш-домен.com -> ваш-ip-адрес
```

2. **Проверьте подключение**:
```bash
nslookup ваш-домен.com
```

---

## Мониторинг

### Логи сервера

```bash
pm2 logs discord-signaling
```

### Статус

```bash
pm2 status
pm2 monit
```

### Перезагрузка

```bash
pm2 restart discord-signaling
pm2 reload discord-signaling
```

---

## Оптимизация производительности

### 1. Переменные окружения

Создайте `.env`:
```
PORT=8080
NODE_ENV=production
LOG_LEVEL=info
```

### 2. Увеличение лимитов

```bash
# Linux
ulimit -n 65535
```

### 3. Использование Nginx как балансировщика

Конфигурация `/etc/nginx/sites-available/default`:

```nginx
upstream signaling_server {
    server localhost:8080;
    server localhost:8081;
    server localhost:8082;
}

server {
    listen 80;
    server_name ваш-домен.com;

    location / {
        proxy_pass http://signaling_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Безопасность

### 1. SSL/TLS сертификат

```bash
certbot certonly --standalone -d ваш-домен.com
```

### 2. Firewall

```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
```

### 3. Rate limiting

Добавьте в `signaling-server.js`:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
```

---

## Решение проблем

### WebSocket не подключается

1. Проверьте файрвол:
```bash
telnet ваш-адрес 8080
```

2. Проверьте логи сервера:
```bash
pm2 logs
```

3. Убедитесь в правильном адресе в `app.js`

### Высокое использование памяти

```bash
# Установите лимит памяти
pm2 start signaling-server.js --max-memory-restart 200M
```

### Медленное соединение

1. Используйте CDN для статических файлов
2. Сожмите содержимое:
```bash
# Gzip в Nginx
gzip on;
gzip_types text/plain application/json;
```

---

## Полезные ссылки

- [WebRTC Signaling Specification](https://www.w3.org/TR/webrtc/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Heroku Documentation](https://devcenter.heroku.com/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [DigitalOcean Docs](https://docs.digitalocean.com/)

---

**Готово! Ваше приложение развернуто и работает! 🎉**
