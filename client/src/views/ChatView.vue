<template>
  <div class="chat-view mt-4 flex flex-col justify-start">
    <div class="w-full items-center justify-center content-center">
      <h1
        class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
      >
        Chat app 🐱‍🐉
      </h1>
      <p
        :class="`text-right text-${
          nesWS && nesWS.conectado ? 'green-500' : 'red-900'
        }`"
      >
        {{ nesWS && nesWS.conectado ? "Conectado" : "Desconectado" }}
      </p>
      <div
        class="grow h-full flex-col divide-y divide-gray-300/50 shadow my-6 p-4"
      >
        <h1 class="font-bold underline">
          Mensajes
          {{
            nesWS && nesWS.nesClient && nesWS.nesClient
              ? nesWS.nesClient.id
              : ""
          }}
        </h1>
        <div
          class="md:container md:m-auto py-4 mt-4 flex flex-col content-start items-start"
        >
          <template v-for="(mensaje, index) in mensajes" :key="index">
            <p
              :class="`py-2 px-4 mb-2 shadow rounded-full text-white ${
                mensaje.author === id ? estiloYoAutor : estiloOtroAutor
              }`"
            >
              {{ mensaje.message }}
            </p>
          </template>
        </div>
        <form class="flex pt-4" v-on:submit="submitForm">
          <input
            type="text"
            class="grow border text-base drop-shadow rounded-l-lg focus:outline-none px-2"
            name="mensajeNuevo"
            id="mensajeNuevo"
          />
          <input
            type="submit"
            class="bg-sky-500 rounded-r-lg px-6 py-2 text-white shadow hover:drop-shadow-md cursor-pointer hover:bg-sky-600"
            value="Enviar"
          />
        </form>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { NesWebSocket } from "../utils/websocket";

export default {
  data: () => ({
    nesWS: undefined,
    conectado: false,
    mensajes: [],
    estiloOtroAutor: "bg-slate-400 text-left",
    estiloYoAutor: "bg-indigo-600 text-right",
    /*
    suscripciones: {
      messages: {
        path: "/message",
        handler(message, flags) {
          console.log("Escuchando de /message");
          console.log(message);
          this.mensajes.push(message);
        },
      },
    },
    */
  }),
  async beforeUnmount() {
    if (this.nesWS) {
      await this.nesWS.cerrarSesion();
    }
  },
  async mounted() {
    console.log("Servidor:", import.meta.env.VITE_SERVERURL);
    this.nesWS = new NesWebSocket();
    try {
      await this.nesWS.conectar();
      this.conectado = this.nesWS.conectado;
      // this.nesWS.setUserSubscriptions(this.suscripciones);
      /*
      await this.nesWS.iniciarSuscripciones();
      */
      this.nesWS.nesClient.subscribe("/message", function (message, flags) {
        console.log("Escuchando de /message");
        console.log(message);
        this.mensajes.push(message);
      });
      await this.obtenerHistorial();

      this.nesWS.onUpdate(function (message) {
        console.log("onUpdate: Agregando mensaje:", message);
        this.mensajes.push(message);
      });
    } catch (error) {
      console.error("No se pudo conectar al servidor\n", error);
    }
  },
  methods: {
    async obtenerHistorial() {
      try {
        const path = "history";
        const method = "POST";
        const historial = await this.nesWS.request({ path, method });
        this.mensajes = historial.payload;
      } catch (error) {
        console.error("No se pudo obtener el historial de la conversación");
      }
    },
    async submitForm(event) {
      try {
        event.preventDefault();
        const message = event.target.elements[0].value;
        if (message && message.length > 3) {
          const author = this.nesWS.nesClient.id;
          const payload = { message, author };
          console.log("Enviando mensaje", payload);
          const respuesta = await this.nesWS.request({
            path: "message",
            method: "POST",
            payload,
          });
          console.log("Respuesta del servidor:", respuesta);
          if (respuesta.payload) {
            event.target.elements[0].value = "";
          }
        }
      } catch (error) {
        console.error("No se pudo enviar form");
      }
    },
  },
};
</script>

<style scoped>
@media (min-width: 1024px) {
  .chat-view {
    /* max-height: 80vh; */
    min-height: 80vh;
    max-width: 100vw;
    display: flex;
    align-items: center;
    /* justify-content: flex-end; */
  }
}
</style>
