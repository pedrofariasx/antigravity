const { makeRequest } = require("./helpers/http-client.cjs");

async function run() {
  console.log("\n=== IMAGE SUPPORT TEST ===");

  // A small base64 image (1x1 transparent png)
  const base64Image =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  const response = await makeRequest({
    model: "gemini-3-flash", // Gemini usually handles images well
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What is in this image?" },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  });

  if (response.statusCode !== 200) {
    console.error("FAILED: Status code", response.statusCode);
    console.error(response);
    process.exit(1);
  }

  const content = response.choices?.[0]?.message?.content;
  if (content) {
    console.log("SUCCESS: Image processed");
    console.log("Response:", content);
  } else {
    console.error("FAILED: No content returned for image");
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
