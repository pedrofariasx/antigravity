const { streamRequest } = require("./helpers/http-client.cjs");

async function run() {
  console.log("\n=== STREAMING TEST ===");

  const response = await streamRequest({
    model: "gemini-3-flash",
    messages: [{ role: "user", content: "Count to 5" }],
    stream: true,
  });

  if (response.statusCode !== 200) {
    console.error("FAILED: Status code", response.statusCode);
    process.exit(1);
  }

  if (response.chunks.length === 0) {
    console.error("FAILED: No chunks received");
    process.exit(1);
  }

  const content = response.chunks
    .map((c) => c.choices?.[0]?.delta?.content || "")
    .join("");

  if (content.length > 0) {
    console.log("SUCCESS: Streamed content received");
    console.log("Content:", content);
  } else {
    console.error("FAILED: Empty streamed content");
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
