// @ts-nocheck

import { NeuralDeepCode } from "@neuraldeepcode/core"
import { ReadTool } from "@neuraldeepcode/core/tools"

const ndcode = NeuralDeepCode.make({})

ndcode.tool.add(ReadTool)

ndcode.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

ndcode.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

ndcode.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await ndcode.session.create({
  agent: "build",
})

ndcode.subscribe((event) => {
  console.log(event)
})

await ndcode.session.prompt({
  sessionID,
  text: "hey what is up",
})

await ndcode.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await ndcode.session.wait()

console.log(await ndcode.session.messages(sessionID))
