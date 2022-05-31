<template>
  <div class="chat-view mt-4 flex flex-col justify-start">
    <div class="w-full items-center justify-center content-center">
      <h1
        class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
      >
        Chat app 🐱‍🐉
      </h1>
      <p :class="`text-right text-${conectado ? 'green-500' : 'red-900'}`">
        {{ conectado ? "Conectado" : "Desconectado" }}
      </p>
      <div
        class="grow h-full flex-col divide-y divide-gray-300/50 shadow my-6 p-4"
      >
        <h1 class="font-bold underline">
          Mensajes
          {{ nesWS ? nesWS.id : "" }}
        </h1>
        <div
          class="md:container md:m-auto py-4 mt-4 flex flex-col content-start items-start"
        >
          <template v-for="(mensaje, index) in mensajes" :key="index">
            <div
              :class="`w-full flex flex-row justify-${
                mensaje.author === nesWS.id ? 'end' : 'start'
              }`"
            >
              <p
                :class="`py-2 px-4 mb-2 max-w-[75%] text-justify shadow rounded-3xl text-white ${
                  mensaje.author === nesWS.id ? estiloYoAutor : estiloOtroAutor
                }`"
              >
                {{ mensaje.message }}
              </p>
            </div>
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
            class="bg-sky-500 rounded-r-lg px-6 py-2 text-white drop-shadow hover:drop-shadow-md cursor-pointer hover:bg-sky-600"
            value="Enviar"
          />
        </form>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { Client } from "@hapi/nes/lib/client";
import { useServerURL } from "@/hooks/constants";

export default {
  data: () => ({
    nesWS: undefined,
    conectado: false,
    mensajes: [],
    estiloOtroAutor: "bg-slate-400 hover:bg-slate-500 text-left justify-start",
    estiloYoAutor: "bg-indigo-600 hover:bg-indigo-700 text-right justify-end",
  }),
  async beforeUnmount() {
    if (this.nesWS) {
      try {
        this.nesWS.subscriptions().forEach(async (suscripcion) => {
          await this.nesWS.unsubscribe(suscripcion);
        });
        await this.nesWS.disconnect();
        this.conectado = false;
        this.mensajes = [];
      } catch (error) {
        console.error("No se pudo cerrar sesión");
      }
    }
  },
  async mounted() {
    const [, websocketURL] = useServerURL();

    console.log("Servidor:", import.meta.env.VITE_SERVERURL);
    this.nesWS = new Client(websocketURL);

    try {
      await this.nesWS.connect();
      this.conectado = true;

      this.nesWS.subscribe("/message", (message, flags) => {
        this.mensajes?.push(message);
      });

      await this.obtenerHistorial();

      this.nesWS.onUpdate((message) => {
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
        const historial = await this.request({ path, method });
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
          const author = this.nesWS.id;
          const payload = { message, author };
          console.log("Enviando mensaje", payload);
          const respuesta = await this.request({
            path: "message",
            method: "POST",
            payload,
          });

          console.log("Respuesta del servidor:", respuesta);

          if (respuesta.payload) {
            event.target.elements[0].value = "";
            this.mensajes.push(payload);
          }
        }
      } catch (error) {
        console.error("No se pudo enviar form");
      }
    },
    async request({ path, method, payload }) {
      try {
        const response = await this.nesWS.request({
          path,
          method,
          payload,
        });
        return response;
      } catch (error) {
        console.error("Error en request de WS:", error);
        throw new Error("No se pudo obtener la información");
      }
    },
    async cerrarSesion() {
      try {
        // Object.keys(this.nesWS.subscriptions()).forEach((suscripcion) => {});
        await this.nesWS.disconnect();
        this.conectado = false;
      } catch (error) {
        console.error("Error con las suscripciones");
        throw new Error(error);
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
