const { makeRequest } = require("./helpers/http-client.cjs");

async function run() {
  console.log("\n=== INTERLEAVED THINKING TEST ===");

  // Multi-step task to force interleaved thinking
  const response = await makeRequest({
    model: "gemini-3-flash",
    messages: [
      {
        role: "user",
        content: "What is 123 * 456? Calculate it step by step.",
      },
    ],
    max_tokens: 500,
  });

  if (response.statusCode !== 200) {
    console.error("FAILED: Status code", response.statusCode);
    process.exit(1);
  }

  const content = response.choices?.[0]?.message?.content;
  if (content && content.length > 0) {
    console.log("SUCCESS: Response received");
    console.log("Preview:", content.substring(0, 100) + "...");
  } else {
    console.error("FAILED: No content");
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
