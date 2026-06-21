export * from "./client.js"
export * from "./server.js"

import { createNeuralDeepCodeClient } from "./client.js"
import { createNeuralDeepCodeServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export async function createNeuralDeepCode(options?: ServerOptions) {
  const server = await createNeuralDeepCodeServer({
    ...options,
  })

  const client = createNeuralDeepCodeClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
