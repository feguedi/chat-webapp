<template>
  <div class="chat-view">
    <div class="flex-col">
      <h1 class="bg-green-700 font-bold">Chat app 🐱‍🐉</h1>
      <div class="shadow">
        <p
          class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
        >
          {{ conectado ? "Conectado" : "Desconectado" }}
        </p>
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
  }),
  async beforeUnmount() {
    if (this.nesWS) {
      await this.nesWS.cerrarSesion();
    }
  },
  async created() {
    console.log("Servidor:", import.meta.env.VITE_SERVERURL);
    this.nesWS = new NesWebSocket();
    try {
      await this.nesWS.conectar();
      this.conectado = this.nesWS.conectado;
      await this.nesWS.iniciarSuscripciones();
    } catch (error) {
      console.error("No se pudo conectar al servidor\n", error);
    }
  },
  watch: {
    conectado(_, __) {
      console.log('propiedad "conectado" cambió');
    },
  },
};
</script>

<style scoped>
@media (min-width: 1024px) {
  .chat-view {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: end;
  }
}
</style>
