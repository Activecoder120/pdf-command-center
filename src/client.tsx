import { StrictMode, startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

startTransition(() => {
  const app = (
    <StrictMode>
      <StartClient />
    </StrictMode>
  );
  if (import.meta.env.MODE === "pages") {
    // Pages serves one empty SPA shell at multiple paths. It has no rendered
    // tool content to hydrate; mount it as a client app instead.
    createRoot(document).render(app);
  } else {
    hydrateRoot(document, app);
  }
});
