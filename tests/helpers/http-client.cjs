/**
 * Shared Test HTTP Client Utilities (OpenAI Compatible)
 */
const http = require("http");

const BASE_URL = "localhost";
const PORT = 8080;

/**
 * Make a non-streaming JSON request to the OpenAI-compatible API
 */
function makeRequest(body, path = "/v1/chat/completions", method = "POST") {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer test-token",
    };

    if (data) {
      headers["Content-Length"] = Buffer.byteLength(data);
    }

    const req = http.request(
      {
        host: BASE_URL,
        port: PORT,
        path: path,
        method: method,
        headers: headers,
      },
      (res) => {
        let fullData = "";
        res.on("data", (chunk) => (fullData += chunk.toString()));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(fullData);
            resolve({ ...parsed, statusCode: res.statusCode });
          } catch (e) {
            // Se falhar o parse (ex: erro 500 html), retorna raw
            resolve({ raw: fullData, statusCode: res.statusCode });
          }
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

/**
 * Make a streaming SSE request to the OpenAI-compatible API
 */
function streamRequest(body, path = "/v1/chat/completions") {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        host: BASE_URL,
        port: PORT,
        path: path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        const chunks = [];
        let fullData = "";

        res.on("data", (chunk) => {
          fullData += chunk.toString();
        });

        res.on("end", () => {
          // Parse OpenAI SSE format
          // data: {...}
          const lines = fullData.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line.trim() !== "data: [DONE]") {
              try {
                const jsonStr = line.substring(6).trim();
                const parsed = JSON.parse(jsonStr);
                chunks.push(parsed);
              } catch (e) {
                // ignore parse errors for partial lines
              }
            }
          }
          resolve({ chunks, statusCode: res.statusCode, raw: fullData });
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

module.exports = {
  makeRequest,
  streamRequest,
};
