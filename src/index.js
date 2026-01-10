/**
 * Antigravity Proxy
 * Entry point - starts the proxy server
 */

import "dotenv/config";
import app from "./server.js";
import { DEFAULT_PORT } from "./constants.js";
import { logger } from "./utils/logger.js";
import path from "path";
import os from "os";

// Parse command line arguments
const args = process.argv.slice(2);
const isDebug = args.includes("--debug") || process.env.DEBUG === "true";
const isFallbackEnabled =
  args.includes("--fallback") || process.env.FALLBACK === "true";

// Initialize logger
logger.setDebug(isDebug);

if (isDebug) {
  logger.debug("Debug mode enabled");
}

if (isFallbackEnabled) {
  logger.info("Model fallback mode enabled");
}

// Export fallback flag for server to use
export const FALLBACK_ENABLED = isFallbackEnabled;

const PORT = process.env.PORT || DEFAULT_PORT;

// Home directory for account storage
const HOME_DIR = os.homedir();
const CONFIG_DIR = path.join(HOME_DIR, ".antigravity-proxy");

app.listen(PORT, () => {
  // Clear console for a clean start
  console.clear();

  const border = "║";
  // align for 2-space indent (60 chars), align4 for 4-space indent (58 chars)
  const align = (text) => text + " ".repeat(Math.max(0, 60 - text.length));
  const align4 = (text) => text + " ".repeat(Math.max(0, 58 - text.length));

  // Build Control section dynamically
  let controlSection =
    "║  Control:                                                    ║\n";
  if (!isDebug) {
    controlSection +=
      "║    --debug            Enable debug logging                   ║\n";
  }
  if (!isFallbackEnabled) {
    controlSection +=
      "║    --fallback         Enable model fallback on quota exhaust ║\n";
  }
  controlSection +=
    "║    Ctrl+C             Stop server                            ║";

  // Build status section if any modes are active
  let statusSection = "";
  if (isDebug || isFallbackEnabled) {
    statusSection =
      "║                                                              ║\n";
    statusSection +=
      "║  Active Modes:                                               ║\n";
    if (isDebug) {
      statusSection +=
        "║    ✓ Debug mode enabled                                      ║\n";
    }
    if (isFallbackEnabled) {
      statusSection +=
        "║    ✓ Model fallback enabled                                  ║\n";
    }
  }

  logger.log(`
╔══════════════════════════════════════════════════════════════╗
║                Antigravity Proxy Server                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
${border}  ${align(`Server running at: http://localhost:${PORT}`)}${border}
${statusSection}║                                                              ║
${controlSection}
║                                                              ║
║  Endpoints:                                                  ║
║    POST /v1/chat/completions - OpenAI Chat API               ║
║    GET  /v1/models           - List available models         ║
║    GET  /models              - OpenAI models alias           ║
║    GET  /health              - Health check                  ║
║    GET  /account-limits      - Account status & quotas       ║
║    POST /refresh-token       - Force token refresh           ║
║                                                              ║
${border}  ${align(`Configuration:`)}${border}
${border}    ${align4(`Storage: ${CONFIG_DIR}`)}${border}
║                                                              ║
║  Add Google accounts:                                        ║
║    npm run accounts                                          ║
║                                                              ║
║  Prerequisites (if no accounts configured):                  ║
║    - Antigravity must be running                             ║
║    - Have a chat panel open in Antigravity                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);

  logger.success(`Server started successfully on port ${PORT}`);
  if (isDebug) {
    logger.warn("Running in DEBUG mode - verbose logs enabled");
  }
});
