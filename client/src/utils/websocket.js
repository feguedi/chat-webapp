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
    this.id = this.nesClient.id;

    this.nesClient.onConnect(() => {
      console.log("Conectado al servidor (WebSockets)");
    });

    this.nesClient.onDisconnect((willReconnect, log) => {
      console.log("Se desconectó del servidor");
      console.log(`El servidor${willReconnect ? "" : " no"} se reconectará`);
    });

    this.nesClient.onError((err) => console.error("NesError -", err));
  }

  /**
   * Agrega propiedades al objeto "subscriptions" de la clase
   */
  setUserSubscriptions(subs) {
    Object.keys(subs).forEach((key) => {
      const { path } = subs[key];
      this.subscriptions[key] = {
        path,
        handler(update, flags) {
          console.log("NesClient: Escuchando", path, "respuesta:", update);
          subs[key]["callback"](update);
        },
      };
    });
  }

  /**
   * Inicia la conexión con el servidor
   */
  async conectar() {
    // https://hapi.dev/module/nes/api/?v=12.0.4#client-3
    try {
      await this.nesClient.connect();
      this.conectado = true;
      this.id = this.nesClient.id;
      console.log("ID del WS:", this.id);
    } catch (error) {
      console.error("Error al conectar con el servidor:\n", error);
    }
  }

  /**
   * Asigna valores a los atributos de la clase para poder iniciar las suscripciones
   */
  iniciarSuscripciones() {
    try {
      // https://hapi.dev/module/nes/api/?v=12.0.4#client-4
      Object.keys(this.subscriptions).forEach(async (key) => {
        try {
          const { path, handler } = this.subscriptions[key];
          if (String(path).length > 0) {
            console.log("Suscribiendo a", path);
            await this.nesClient.subscribe(path, handler);
          }
        } catch (error) {
          console.error("No se pudo crear la suscripción");
        }
      });

      Object.keys(this.nesClient.subscriptions).forEach((suscripcion) => {
        console.log("Suscripción:", suscripcion);
      });

      // this.nesClient.message("Hola a todos");
    } catch (error) {
      throw new Error("No se pudo suscribir");
    }
  }

  async enviarMensaje(mensaje) {
    try {
      const res = await this.nesClient.message(mensaje);
      console.log("Respuesta de envío de mensaje:", res);
    } catch (error) {
      console.error("No se pudo enviar mensaje\n", mensaje);
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

    // Expresión regular para saber si un string es una dirección IP v4
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
    await this.nesClient.disconnect();
    this.conectado = false;
  }
}
