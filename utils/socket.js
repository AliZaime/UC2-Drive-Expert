let io;

module.exports = {
    init: (httpServer) => {
        io = require('socket.io')(httpServer, {
            cors: {
                origin: "*", // Allow all origins for Hackathon simplicity
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            console.log('🔌 Client Connected:', socket.id);

            // Simple room joining logic
            // Client sends: socket.emit('join', 'USER_ID')
            socket.on('join', (userId) => {
                socket.join(userId);
                console.log(`👤 User ${userId} joined room`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
