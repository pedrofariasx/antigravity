const { makeRequest } = require("./helpers/http-client.cjs");

async function run() {
  console.log("\n=== THINKING MODELS TEST ===");

  // Test with a thinking model (mapped to Gemini or Claude thinking)
  const response = await makeRequest({
    model: "gemini-3-flash", // Should support thinking
    messages: [
      { role: "user", content: "Explain quantum entanglement simply." },
    ],
    max_tokens: 100,
  });

  if (response.statusCode !== 200) {
    console.error("FAILED: Status code", response.statusCode);
    console.error(response);
    process.exit(1);
  }

  const content = response.choices?.[0]?.message?.content;
  if (!content || content.length === 0) {
    console.error("FAILED: No content returned");
    process.exit(1);
  }

  console.log("SUCCESS: Received response from thinking model");
  console.log("Preview:", content.substring(0, 50) + "...");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
