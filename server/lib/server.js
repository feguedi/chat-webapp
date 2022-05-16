// https://erwann.blog/building-websocket-app-with-hapi-nes/
require('dotenv').config()
const Hapi = require('@hapi/hapi')
const Joi = require('joi')

const history = []

async function Server() {
    const server = Hapi.server({
        host: '0.0.0.0',
        port: process.env.PORT,
    })

    server.route([
        {
            method: 'POST',
            path: '/message',
            options: {
                id: 'message',
                validate: {
                    payload: Joi.object({ message: Joi.string() }),
                },
            },
            handler(request, h) {
                const message = request.payload.message
                console.log(`Message received: ${message}`)
                history.push(message)

                server.publish("/message", { message }) // publish the message to the clients
                return true
            },
        },
        {
            method: 'POST',
            path: '/history',
            options: {
                id: 'history',
            },
            handler(request, h) {
                return history
            }
        },
    ])

    await server.register([
        require('../plugin/ws'),
    ], { once: true })

    server.subscription('/message')

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
