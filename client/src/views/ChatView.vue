<template>
  <h1 class="text-3xl font-bold underline">Chat app</h1>
</template>

<script>
/* eslint-env node */
export default {
  mounted() {
    console.log("Variables de entorno:", import.meta.env.VITE_SERVERURL);
  },
};
</script>
