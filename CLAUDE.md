# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Antigravity Claude Proxy is a Node.js proxy server that exposes an Anthropic-compatible API backed by Antigravity's Cloud Code service. It enables using Claude models (`claude-sonnet-4-5-thinking`, `claude-opus-4-5-thinking`) with Claude Code CLI.

The proxy translates requests from Anthropic Messages API format → Google Generative AI format → Antigravity Cloud Code API, then converts responses back to Anthropic format with full thinking/streaming support.

## Commands

```bash
# Install dependencies
npm install

# Start server (runs on port 8080)
npm start

# Start with file watching for development
npm dev

# Account management
npm run accounts         # Interactive account management
npm run accounts:add     # Add a new Google account via OAuth
npm run accounts:list    # List configured accounts
npm run accounts:verify  # Verify account tokens are valid

# Run all tests (server must be running on port 8080)
npm test

# Run individual tests
npm run test:signatures    # Thinking signatures
npm run test:multiturn     # Multi-turn with tools
npm run test:streaming     # Streaming SSE events
npm run test:interleaved   # Interleaved thinking
npm run test:images        # Image processing
```

## Architecture

**Request Flow:**
```
Claude Code CLI → Express Server (server.js) → CloudCode Client → Antigravity Cloud Code API
```

**Key Modules:**

- **server.js**: Express server exposing Anthropic-compatible endpoints (`/v1/messages`, `/v1/models`, `/health`, `/accounts`)
- **cloudcode-client.js**: Makes requests to Antigravity Cloud Code API with retry/failover logic, handles both streaming and non-streaming
- **format-converter.js**: Bidirectional conversion between Anthropic and Google Generative AI formats, including thinking blocks and tool calls
- **account-manager.js**: Multi-account pool with round-robin rotation, rate limit handling, and automatic cooldown
- **oauth.js**: Google OAuth implementation for adding accounts
- **token-extractor.js**: Extracts tokens from local Antigravity app installation (legacy single-account mode)
- **constants.js**: API endpoints, model mappings, configuration values

**Multi-Account Load Balancing:**
- Round-robin rotation across configured accounts
- Automatic switch on 429 rate limit errors
- Configurable cooldown period for rate-limited accounts
- Account state persisted to `~/.config/antigravity-proxy/accounts.json`

## Testing Notes

- Tests require the server to be running (`npm start` in separate terminal)
- Tests are CommonJS files (`.cjs`) that make HTTP requests to the local proxy
- Test runner supports filtering: `node tests/run-all.cjs <filter>` to run matching tests
