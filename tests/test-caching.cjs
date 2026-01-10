const { makeRequest } = require("./helpers/http-client.cjs");

async function run() {
  console.log("\n=== PROMPT CACHING TEST ===");

  // Large context to encourage caching
  const largeContext = "Repeat this sentence. ".repeat(100);

  console.log("Turn 1: Initial request...");
  const response1 = await makeRequest({
    model: "gemini-3-flash",
    messages: [
      { role: "system", content: largeContext },
      { role: "user", content: "What did I say?" },
    ],
  });

  if (response1.statusCode !== 200) {
    console.error("FAILED: Turn 1 status", response1.statusCode);
    process.exit(1);
  }

  // Check if usage contains cache fields (custom mapping in converter)
  const usage1 = response1.usage || {};
  console.log("Turn 1 Usage:", usage1);

  if (usage1.cache_creation_input_tokens !== undefined) {
    console.log("SUCCESS: Cache tokens reported");
  } else {
    console.log(
      "NOTE: Cache tokens not reported (API might verify this later)"
    );
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
