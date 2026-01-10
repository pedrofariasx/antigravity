const { spawn } = require("child_process");
const path = require("path");

const tests = [
  "test-thinking.cjs",
  "test-tools.cjs",
  "test-streaming.cjs",
  "test-images.cjs",
  "test-caching.cjs",
  "test-interleaved.cjs",
];

async function runTests() {
  console.log("Running tests against OpenAI-compatible API...");
  console.log("Ensure server is running on port 8080\n");

  for (const test of tests) {
    const testPath = path.join(__dirname, test);
    console.log(`Running ${test}...`);

    await new Promise((resolve, reject) => {
      const proc = spawn("node", [testPath], { stdio: "inherit" });
      proc.on("close", (code) => {
        if (code === 0) {
          console.log(`✅ ${test} PASSED\n`);
          resolve();
        } else {
          console.error(`❌ ${test} FAILED\n`);
          // Don't reject to allow all tests to attempt to run?
          // Or fail fast? Let's allow all to run.
          resolve();
        }
      });
      proc.on("error", reject);
    });
  }
}

runTests().catch(console.error);
