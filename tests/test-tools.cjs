const { makeRequest } = require("./helpers/http-client.cjs");

async function run() {
  console.log("\n=== TOOLS TEST ===");

  const tools = [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get weather",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string" },
          },
          required: ["location"],
        },
      },
    },
  ];

  const response = await makeRequest({
    model: "gemini-3-flash",
    messages: [{ role: "user", content: "What is the weather in Paris?" }],
    tools: tools,
    tool_choice: "auto",
  });

  const toolCalls = response.choices?.[0]?.message?.tool_calls;

  if (!toolCalls || toolCalls.length === 0) {
    console.log(
      "NOTE: Model decided not to call tool (valid but not ideal for test)"
    );
    console.log(response);
  } else {
    const fnName = toolCalls[0].function.name;
    if (fnName === "get_weather") {
      console.log("SUCCESS: Tool call received");
    } else {
      console.error("FAILED: Unexpected tool call", fnName);
      process.exit(1);
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
