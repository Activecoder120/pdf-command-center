import { archive } from "./pdf-engine";
import type { OutputData } from "./pdf-types";
self.onmessage = (event: MessageEvent<OutputData[]>) => {
  try {
    const output = archive(event.data);
    self.postMessage({ output }, { transfer: [output.bytes.buffer as ArrayBuffer] });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Unable to create ZIP." });
  }
};
