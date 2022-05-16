/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable no-unused-expressions */
import { Client } from "@hapi/nes/lib/client";

/**
 * @typedef DisconnectLogObject
 * @type {Object}
 * @property {number} code: {
 * @property {string} explanation: {
 * @property {string} reason: {
 * @property {boolean} wasClean: {
 */

/**
 * @typedef DisconnectHandler
 * @type {callback}
 * @param {boolean} willReconnect: Un booleano indicando si el cliente intentará conectarse automáticamente
 * @param {DisconnectLogObject} log: Objeto con las opciones del log
 */

/**
 * @callback ErrorHandler
 * @param {Error} error - Objeto de error
 */

/**
 * @callback UpdateHandler
 * @param {any} message - Mensaje del servidor
 */

/**
 * @typedef PayloadMessage
 * @type {Object}
 * @property {String} message - Mensaje a enviar
 */

/**
 * @typedef NesRequest
 * @type {Object}
 * @property {String} path - Endpoint de la ruta
 * @property {String} method - Método/verbo HTTP de la solicitud
 * @property {PayloadMessage} payload - Objeto con mensaje
 */

/**
 * @typedef Suscripcion
 * @type {Object}
 * @property {String} path - Endpoint al que se quiere suscribir
 * @property {Client.Handler} handler - Función que manejará las respuestas de las suscripciones
 */

/**
 * De la forma más hardcodeada posible
 * @typedef ObjetoSuscripciones
 * @type {Object}
 * @property {Suscripcion} messages - Suscripción a los mensajes
 */

/**
 * Clase para manejar WebSockets
 */
export class NesWebSocket {
  constructor() {
    /**
     * @type {Client}
     */
    this.nesClient = undefined;
    this.websocketURL = undefined;
    this.serverURL = undefined;
    /**
     * @type {ObjetoSuscripciones}
     */
    this.subscriptions = {};
    this.conectado = false;

    this.setServerURL();
    console.log("WebSockets URL:", this.websocketURL);
    this.nesClient = new Client(this.websocketURL);
  }

  /**
   * Agrega propiedades al objeto "subscriptions" de la clase
   */
  setUserSubscriptions() {
    this.subscriptions.messages = {
      path: "/message",
      handler(message, flags) {
        console.log("Funcion de handler de logs");
      },
    };
  }

  /**
   * Inicia la conexión con el servidor
   */
  async conectar() {
    // https://hapi.dev/module/nes/api/?v=12.0.4#client-3
    await this.nesClient.connect();
    console.log("Conectado al servidor");
    this.conectado = true;
  }

  /**
   * Asigna valores a los atributos de la clase para poder iniciar las suscripciones
   */
  iniciarSuscripciones() {
    try {
      this.setUserSubscriptions();
      // https://hapi.dev/module/nes/api/?v=12.0.4#client-4
      Object.keys(this.subscriptions).forEach(async (key) => {
        const { path, handler } = this.subscriptions[key];
        if (String(path).length > 0) {
          await this.nesClient.subscribe(path, handler);
        }
      });

      Object.keys(this.nesClient.subscriptions).forEach((suscripcion) => {
        console.log("Suscripción:", suscripcion);
      });
    } catch (error) {
      throw new Error("No se pudo suscribir");
    }
  }

  /**
   * Solicita información al servidor desde el WS
   * @param {NesRequest} nesRequest Parámetro de la solicitud
   * @returns {Object} Respuesta del servidor según ese endpoint
   */
  async request({ path, method, payload }) {
    try {
      const response = await this.nesClient.request({
        path,
        method,
        payload,
      });
      return response;
    } catch (error) {
      console.error("Error en request de WS:", error);
      throw new Error("No se pudo obtener la información");
    }
  }

  /**
   * Escuchando error
   * @param {ErrorHandler} callback Callback
   */
  onError(callback) {
    this.nesClient.onError(function (error) {
      callback(error);
    });
  }

  /**
   * Escuchando cambios en la conexión con el servidor
   * @param {DisconnectHandler} disconnectHandler Función callback para cuando se desconecte el cliente
   */
  onDisconnect(disconnectHandler) {
    this.nesClient.onDisconnect(disconnectHandler);
  }

  onConnect() {
    this.nesClient.onConnect(function () {
      console.log("Conectado");
    });
  }

  /**
   * Manejar los mensajes del servidor
   * @param {UpdateHandler} callback Callback a los mensajes que envía el servidor
   */
  onUpdate(callback) {
    this.nesClient.onUpdate(function (message) {
      callback(message);
    });
  }

  /**
   * Establece los atributos de la clase para la URL del servidor
   */
  setServerURL() {
    const serverVar = import.meta.env.VITE_SERVERURL;

    // Expresión regular para saber si un string es una IP local
    // por ejemplo, 192.168.1.33 o 127.0.0.1 (localhost)
    const ipRegex =
      /(25[0-5]|24[0-9]|1[0-9]{2}|[0-9]{2}|[0-9])[.](25[0-5]|24[0-9]|1[0-9]{2}|[0-9]{2}|[0-9])[.](25[0-5]|24[0-9]|1[0-9]{2}|[0-9]{2}|[0-9])[.](25[0-5]|24[0-9]|1[0-9]{2}|[0-9]{2}|[0-9])/i;
    const serverURL = serverVar
      ? new URL(
          `${
            !serverVar.includes("http") && !ipRegex.test(serverVar)
              ? "https"
              : "http"
          }://${serverVar}`
        )
      : new URL(`${window.location.protocol}//${window.location.host}`);
    const isExternal = !ipRegex.test(serverURL.hostname);

    this.websocketURL = serverURL
      ? `${isExternal || serverURL.protocol === "https" ? "wss:" : "ws:"}//${
          serverURL.host
        }`
      : "/";
    this.serverURL = serverURL;
  }

  /**
   * Elimina las suscripciones y cierra el WS
   */
  async cerrarSesion() {
    Object.keys(this.nesClient.subscriptions()).forEach((suscripcion) => {});
    await this.nesClient.close();
    this.conectado = false;
  }
}
