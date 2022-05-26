export function useServerURL() {
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

  const websocketURL = serverURL
    ? `${isExternal || serverURL.protocol === "https" ? "wss:" : "ws:"}//${
        serverURL.host
      }`
    : "/";
  return [serverURL, websocketURL];
}
