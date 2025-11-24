// ============================================
// WebRTC Signaling Handler (для реальных звонков)
// ============================================

class WebRTCSignaling {
    constructor() {
        this.peerConnections = new Map();
        this.localStream = null;
        this.dataChannels = new Map();
        this.signalingServer = null; // В реальном приложении здесь был бы URL сервера
    }

    /**
     * Инициализирует сигнализацию
     * @param {string} userId - ID текущего пользователя
     * @param {string} signalingServerUrl - URL сервера сигнализации
     */
    async initialize(userId, signalingServerUrl = null) {
        this.userId = userId;

        try {
            // Получаем локальный поток
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { width: 1280, height: 720 }
            });
        } catch (error) {
            console.error('Ошибка доступа к камере/микрофону:', error);
            throw error;
        }

        // Подключаемся к серверу сигнализации (если он указан)
        if (signalingServerUrl) {
            this.connectToSignalingServer(signalingServerUrl);
        }
    }

    /**
     * Подключается к серверу WebSocket для сигнализации
     */
    connectToSignalingServer(url) {
        try {
            this.signalingServer = new WebSocket(url);

            this.signalingServer.onopen = () => {
                console.log('Подключено к серверу сигнализации');
                this.signalingServer.send(JSON.stringify({
                    type: 'register',
                    userId: this.userId
                }));
            };

            this.signalingServer.onmessage = (event) => {
                this.handleSignalingMessage(JSON.parse(event.data));
            };

            this.signalingServer.onerror = (error) => {
                console.error('Ошибка сигнализации:', error);
            };

            this.signalingServer.onclose = () => {
                console.log('Отключено от сервера сигнализации');
            };
        } catch (error) {
            console.error('Ошибка подключения к серверу:', error);
        }
    }

    /**
     * Обрабатывает сообщения от сервера сигнализации
     */
    handleSignalingMessage(message) {
        switch (message.type) {
            case 'offer':
                this.handleOffer(message);
                break;
            case 'answer':
                this.handleAnswer(message);
                break;
            case 'ice-candidate':
                this.handleIceCandidate(message);
                break;
            case 'call-end':
                this.handleCallEnd(message);
                break;
            default:
                console.log('Неизвестный тип сообщения:', message.type);
        }
    }

    /**
     * Инициирует вызов другому пользователю
     */
    async initiateCall(remoteUserId, onRemoteStream) {
        console.log(`Инициирование вызова для ${remoteUserId}`);

        const peerConnection = this.createPeerConnection(remoteUserId, onRemoteStream);
        this.peerConnections.set(remoteUserId, peerConnection);

        // Добавляем локальные потоки
        this.localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, this.localStream);
        });

        // Создаем предложение
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Отправляем предложение на сервер
        this.sendSignalingMessage({
            type: 'offer',
            from: this.userId,
            to: remoteUserId,
            sdp: offer.sdp
        });
    }

    /**
     * Обрабатывает входящее предложение
     */
    async handleOffer(message) {
        console.log(`Входящее предложение от ${message.from}`);

        let peerConnection = this.peerConnections.get(message.from);
        if (!peerConnection) {
            peerConnection = this.createPeerConnection(message.from, this.onRemoteStream);
            this.peerConnections.set(message.from, peerConnection);

            // Добавляем локальные потоки
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });
        }

        const offer = new RTCSessionDescription({
            type: 'offer',
            sdp: message.sdp
        });

        await peerConnection.setRemoteDescription(offer);

        // Создаем ответ
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Отправляем ответ
        this.sendSignalingMessage({
            type: 'answer',
            from: this.userId,
            to: message.from,
            sdp: answer.sdp
        });

        // Диспетчим событие входящего вызова
        window.dispatchEvent(new CustomEvent('incomingCall', {
            detail: { userId: message.from }
        }));
    }

    /**
     * Обрабатывает ответ на наше предложение
     */
    async handleAnswer(message) {
        console.log(`Ответ от ${message.from}`);

        const peerConnection = this.peerConnections.get(message.from);
        if (!peerConnection) {
            console.error('Peer connection не найдено');
            return;
        }

        const answer = new RTCSessionDescription({
            type: 'answer',
            sdp: message.sdp
        });

        await peerConnection.setRemoteDescription(answer);
    }

    /**
     * Обрабатывает ICE кандидатов
     */
    async handleIceCandidate(message) {
        const peerConnection = this.peerConnections.get(message.from);
        if (!peerConnection) {
            console.error('Peer connection не найдено');
            return;
        }

        try {
            await peerConnection.addIceCandidate(
                new RTCIceCandidate({
                    candidate: message.candidate,
                    sdpMLineIndex: message.sdpMLineIndex,
                    sdpMid: message.sdpMid
                })
            );
        } catch (error) {
            console.error('Ошибка добавления ICE кандидата:', error);
        }
    }

    /**
     * Обрабатывает завершение вызова
     */
    handleCallEnd(message) {
        const peerConnection = this.peerConnections.get(message.from);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(message.from);
        }

        window.dispatchEvent(new CustomEvent('callEnded', {
            detail: { userId: message.from }
        }));
    }

    /**
     * Создает новое peer connection
     */
    createPeerConnection(remoteUserId, onRemoteStream) {
        const config = {
            iceServers: [
                { urls: ['stun:stun.l.google.com:19302'] },
                { urls: ['stun:stun1.l.google.com:19302'] },
                { urls: ['stun:stun2.l.google.com:19302'] },
                { urls: ['stun:stun3.l.google.com:19302'] },
                { urls: ['stun:stun4.l.google.com:19302'] }
            ]
        };

        const peerConnection = new RTCPeerConnection(config);

        // Обработка удаленных потоков
        peerConnection.ontrack = (event) => {
            console.log('Получен удаленный поток:', event.streams);
            if (onRemoteStream) {
                onRemoteStream(event.streams[0]);
            }
        };

        // Отправка ICE кандидатов
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage({
                    type: 'ice-candidate',
                    from: this.userId,
                    to: remoteUserId,
                    candidate: event.candidate.candidate,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid
                });
            }
        };

        // Отслеживание состояния соединения
        peerConnection.onconnectionstatechange = () => {
            console.log(`Состояние соединения: ${peerConnection.connectionState}`);

            if (peerConnection.connectionState === 'disconnected' ||
                peerConnection.connectionState === 'failed' ||
                peerConnection.connectionState === 'closed') {
                this.peerConnections.delete(remoteUserId);
            }
        };

        // Создание data channel для текстовых сообщений
        const dataChannel = peerConnection.createDataChannel('chat', { ordered: true });
        this.setupDataChannel(dataChannel);
        this.dataChannels.set(remoteUserId, dataChannel);

        peerConnection.ondatachannel = (event) => {
            this.setupDataChannel(event.channel);
            this.dataChannels.set(remoteUserId, event.channel);
        };

        return peerConnection;
    }

    /**
     * Настраивает data channel
     */
    setupDataChannel(dataChannel) {
        dataChannel.onopen = () => {
            console.log('Data channel открыт');
        };

        dataChannel.onmessage = (event) => {
            window.dispatchEvent(new CustomEvent('datachannel-message', {
                detail: JSON.parse(event.data)
            }));
        };

        dataChannel.onerror = (error) => {
            console.error('Data channel ошибка:', error);
        };

        dataChannel.onclose = () => {
            console.log('Data channel закрыт');
        };
    }

    /**
     * Отправляет сообщение через data channel
     */
    sendDataChannelMessage(remoteUserId, data) {
        const dataChannel = this.dataChannels.get(remoteUserId);
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify(data));
        }
    }

    /**
     * Отправляет сообщение сигнализации на сервер
     */
    sendSignalingMessage(message) {
        if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
            this.signalingServer.send(JSON.stringify(message));
        }
    }

    /**
     * Завершает вызов
     */
    endCall(remoteUserId) {
        const peerConnection = this.peerConnections.get(remoteUserId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(remoteUserId);
        }

        this.sendSignalingMessage({
            type: 'call-end',
            from: this.userId,
            to: remoteUserId
        });
    }

    /**
     * Завершает все вызовы
     */
    endAllCalls() {
        this.peerConnections.forEach((peerConnection) => {
            peerConnection.close();
        });
        this.peerConnections.clear();

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.signalingServer) {
            this.signalingServer.close();
        }
    }

    /**
     * Получает локальный поток
     */
    getLocalStream() {
        return this.localStream;
    }

    /**
     * Включает/отключает видео
     */
    toggleVideo(enabled) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    /**
     * Включает/отключает аудио
     */
    toggleAudio(enabled) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    /**
     * Обработчик для удаленного потока (должен быть переопределен)
     */
    onRemoteStream(stream) {
        console.log('Удаленный поток получен:', stream);
    }
}

// Экспортируем для использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebRTCSignaling;
}
