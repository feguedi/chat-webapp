// https://erwann.blog/building-websocket-app-with-hapi-nes/
require('dotenv').config()
const Hapi = require('@hapi/hapi')
const Joi = require('joi')

const history = [{
    author: '1653518723134:LAPTOP-KTIH5L9C:19204:l3m6cruf:10000',
    message: 'Bienvenidos sean todos',
}]

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
                    payload: Joi.object({
                        message: Joi.string().required(),
                        author: Joi.string().required(),
                    }),
                },
            },
            handler(request, h) {
                const { message, author } = request.payload
                console.log(`Message received: ${message}`)
                console.log(`Message author: ${author}`)
                history.push({ message, author })

                server.publish("/message", { message, author }) // publish the message to the clients
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

    server.subscription('/message', {
        filter (path, message, options) {
            return message.author !== options.socket.id
        }
    })

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
