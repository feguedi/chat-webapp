const Nes = require('@hapi/nes')

const nesRegister = {
    plugin: {
        name: 'WebSocketCNX',
        version: '1.0.0',
        async register(server, options) {
            try {
                await server.register({
                    plugin: Nes,
                    options: {
                        headers: ['*'],
                        onConnection(socket) {
                            console.log('Se conectó', socket.id)
                        },
                        onDisconnection(socket) {
                            console.log('Se desconectó', socket.id)
                        },
                    },
                })
            } catch (error) {
                console.error('No se pudo cargar el plugin\n', error)
            }
        },
    },
}

module.exports = nesRegister
