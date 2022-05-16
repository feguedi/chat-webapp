const Hapi = require('@hapi/hapi')

async function Server() {
    const server = Hapi.server({
        host: '0.0.0.0',
        port: process.env.PORT,
    })

    await server.register([
        require('@hapi/nes'),
    ], { once: true })

    return server
}

exports.init = async () => {
    try {
        const server = await Server()
        await server.initialize()
        return server
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

exports.start = async () => {
    try {
        const server = await Server()
        await server.start()
        console.log('Servidor en', server.info.uri)
        return server
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}
