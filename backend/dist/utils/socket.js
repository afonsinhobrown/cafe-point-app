"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('👤 Cliente conectado:', socket.id);
        // Jungar sala da cozinha
        socket.on('joinKitchen', () => {
            socket.join('kitchen');
            console.log('👨‍🍳 Cozinha conectada:', socket.id);
        });
        // Jungar sala de um restaurante específico
        socket.on('joinRestaurant', (restaurantId) => {
            socket.join(`restaurant_${restaurantId}`);
        });
        socket.on('disconnect', () => {
            console.log('❌ Cliente desconectado:', socket.id);
        });
    });
};
exports.setupSocket = setupSocket;
