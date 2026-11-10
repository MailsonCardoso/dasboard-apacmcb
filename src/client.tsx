import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
    {
      onRecoverableError(error, errorInfo) {
        // Em hospedagem estática cPanel (sem SSR Node.js), suprime erros de reconciliação do HTML inicial
        if (
          error instanceof Error &&
          (error.message.includes("418") ||
            error.message.includes("Hydration") ||
            error.message.includes("hydration"))
        ) {
          return;
        }
        console.error(error, errorInfo);
      },
    },
  );
});
