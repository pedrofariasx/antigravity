# Antigravity Proxy

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Antigravity Proxy** allows you to use powerful Google Gemini models (via Antigravity Cloud Code) with any application that supports the **OpenAI API**.

It acts as a bridge: your apps talk "OpenAI" to the proxy, and the proxy talks "Antigravity" to Google, handling all the complex authentication and format conversion transparently.

## ✨ Features

- **OpenAI Compatibility**: Drop-in replacement for OpenAI API (`/v1/chat/completions`). Works with Python/Node.js SDKs, LangChain, and tools like kiloCode.
- **Advanced Model Support**: Full support for **Gemini 3 Flash**, **Gemini 3 Pro**, and others, including **Thinking Signatures** and **Images**.
- **Multi-Account Load Balancing**: Add multiple Google accounts to increase quotas and throughput. The proxy automatically balances requests.
- **Streaming**: Real-time SSE streaming with proper token usage reporting.
- **Prompt Caching**: Automatically leverages prompt caching for huge context windows and lower latency.
- **Secure**: Optional API Key authentication for exposing the proxy safely.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (or Docker)
- A Google account with access to Cloud Code (Antigravity).

### Installation

#### Option 1: Docker (Recommended)

The easiest way to run the proxy.

```bash
# Build the image
docker build -t antigravity-proxy .

# Run the container
# Mounts local config directory to persist authenticated accounts
docker run -d \
  -p 8080:8080 \
  -v ~/.config/antigravity:/root/.config/antigravity \
  --name antigravity \
  antigravity-proxy
```

#### Option 2: Source

```bash
git clone https://github.com/pedrofariasx/antigravity.git
cd antigravity
npm install
npm start
```

---

## 🔑 Account Setup

You must authorize at least one Google account.

**Using Docker:**

```bash
# Enter the running container to add an account
docker exec -it antigravity antigravity-proxy accounts add --no-browser
```

**Using Local:**

```bash
npm run accounts:add
```

This will generate an OAuth URL. Open it in your browser, sign in, and paste the code back into the terminal.

---

## 🛠️ Configuration

You can configure the server using environment variables or a `.env` file in the root directory.

| Variable        | Default  | Description                                                      |
| --------------- | -------- | ---------------------------------------------------------------- |
| `PORT`          | `8080`   | Port to listen on.                                               |
| `PROXY_API_KEY` | _(none)_ | If set, requires `Authorization: Bearer <key>` for all requests. |
| `DEBUG`         | `false`  | Enable verbose logging.                                          |

**Example `.env`:**

```bash
PORT=8080
PROXY_API_KEY=my-secret-key
```

---

## 💻 Usage with Clients

Point your OpenAI-compatible client to `http://localhost:8080/v1`.

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="my-secret-key" # Or "dummy" if no auth configured
)

response = client.chat.completions.create(
    model="gemini-3-flash",
    messages=[{"role": "user", "content": "Explain quantum computing."}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### Node.js

```javascript
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "http://localhost:8080/v1",
  apiKey: "my-secret-key",
});

const response = await openai.chat.completions.create({
  model: "gemini-3-flash",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content);
```

### Curl

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my-secret-key" \
  -d '{
    "model": "gemini-3-flash",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## 🤖 Available Models

Check available models:

```bash
curl http://localhost:8080/v1/models
```

---

## ⚖️ Legal & Disclaimer

**Antigravity Proxy** is an independent open-source project.

- Not affiliated with, endorsed by, or sponsored by Google LLC or Anthropic PBC.
- "Antigravity", "Gemini", and "Cloud Code" are trademarks of Google LLC.
- Use this tool responsibly and in accordance with the Terms of Service of the APIs you access.

## License

MIT
