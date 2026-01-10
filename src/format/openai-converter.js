/**
 * OpenAI Converter
 * Converts OpenAI Chat Completions API requests/responses to/from Anthropic format
 */

import { getModelFamily } from "../constants.js";

/**
 * Convert OpenAI Chat Completions request to Anthropic Messages API format
 *
 * @param {Object} openaiRequest - OpenAI format request
 * @returns {Object} Anthropic format request
 */
export function convertOpenAIToAnthropic(openaiRequest) {
  const {
    model,
    messages,
    max_tokens,
    stream,
    temperature,
    top_p,
    top_k,
    tools,
    tool_choice,
    stop,
    response_format,
  } = openaiRequest;

  // Convert messages
  const anthropicMessages = [];
  let system = undefined;

  for (const msg of messages) {
    const role = msg.role;

    // Handle system messages
    if (role === "system") {
      system =
        typeof msg.content === "string"
          ? msg.content
          : Array.isArray(msg.content)
          ? msg.content.map((c) => c.text).join(" ")
          : "";
      continue;
    }

    // Convert user/assistant messages
    if (role === "user" || role === "assistant") {
      const content = msg.content;

      // Handle different content types
      let anthropicContent;
      if (typeof content === "string") {
        anthropicContent = content;
      } else if (Array.isArray(content)) {
        // Handle multimodal content (text, images, etc.)
        anthropicContent = content.map((part) => {
          if (part.type === "text") {
            return { type: "text", text: part.text };
          } else if (part.type === "image_url") {
            // Convert OpenAI image format to Anthropic
            return {
              type: "image",
              source: {
                type: "base64",
                media_type: part.image_url.url
                  .split(";")[0]
                  .replace("data:", ""),
                data: part.image_url.url.split(",")[1],
              },
            };
          }
          return part;
        });
      } else {
        anthropicContent = String(content);
      }

      // Handle tool responses in assistant messages
      if (role === "assistant" && msg.tool_calls) {
        // Convert tool_calls to tool_use blocks
        const toolUseBlocks = msg.tool_calls.map((tc) => ({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments || "{}"),
        }));

        anthropicMessages.push({
          role: "assistant",
          content: Array.isArray(anthropicContent)
            ? [...anthropicContent, ...toolUseBlocks]
            : toolUseBlocks,
        });
      } else if (role === "assistant" && msg.tool_calls === undefined) {
        // Regular assistant message
        anthropicMessages.push({
          role: "assistant",
          content: anthropicContent,
        });
      } else {
        // User message
        anthropicMessages.push({
          role: "user",
          content: anthropicContent,
        });
      }
    } else if (role === "tool") {
      // Convert tool message to tool_result
      anthropicMessages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: msg.tool_call_id,
            content: msg.content,
          },
        ],
      });
    }
  }

  // Convert tools
  let anthropicTools = undefined;
  if (tools && tools.length > 0) {
    anthropicTools = tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description || "",
      input_schema: tool.function.parameters || {
        type: "object",
        properties: {},
      },
    }));
  }

  // Convert tool_choice
  let anthropicToolChoice = undefined;
  if (tool_choice) {
    if (tool_choice === "auto") {
      anthropicToolChoice = { type: "auto" };
    } else if (tool_choice === "required") {
      anthropicToolChoice = { type: "any" };
    } else if (
      typeof tool_choice === "object" &&
      tool_choice.type === "function"
    ) {
      anthropicToolChoice = {
        type: "tool",
        name: tool_choice.function.name,
      };
    }
  }

  // Handle response_format for JSON mode
  let thinking = undefined;
  if (response_format && response_format.type === "json_object") {
    // JSON mode - add instruction to system prompt
    if (!system) system = "";
    system += "\n\nRespond in valid JSON format only.";
  }

  // Build Anthropic request
  const anthropicRequest = {
    model: model || "claude-3-5-sonnet-20241022",
    messages: anthropicMessages,
    max_tokens: max_tokens || 4096,
    stream: stream || false,
  };

  if (system) anthropicRequest.system = system;
  if (temperature !== undefined) anthropicRequest.temperature = temperature;
  if (top_p !== undefined) anthropicRequest.top_p = top_p;
  if (top_k !== undefined) anthropicRequest.top_k = top_k;
  if (anthropicTools) anthropicRequest.tools = anthropicTools;
  if (anthropicToolChoice) anthropicRequest.tool_choice = anthropicToolChoice;
  if (stop && stop.length > 0) anthropicRequest.stop_sequences = stop;

  // Handle thinking parameter for compatible models
  const modelFamily = getModelFamily(model || "");
  if (modelFamily === "claude" || modelFamily === "gemini") {
    // Enable thinking by default for thinking models
    if (model.includes("thinking") || model.includes("gemini-3")) {
      anthropicRequest.thinking = {
        type: "enabled",
        budget_tokens: 16000,
      };
    }
  }

  return anthropicRequest;
}

/**
 * Convert Anthropic Messages API response to OpenAI Chat Completions format
 *
 * @param {Object} anthropicResponse - Anthropic format response
 * @param {string} model - The model name used
 * @returns {Object} OpenAI format response
 */
export function convertAnthropicToOpenAI(anthropicResponse, model) {
  const { id, content, stop_reason, usage } = anthropicResponse;

  // Convert content blocks
  const openaiContent = [];
  const toolCalls = [];
  let finishReason = "stop";

  // Handle different stop reasons
  if (stop_reason === "max_tokens") {
    finishReason = "length";
  } else if (stop_reason === "tool_use") {
    finishReason = "tool_calls";
  }

  for (const block of content) {
    if (block.type === "text") {
      openaiContent.push({
        index: 0,
        message: {
          role: "assistant",
          content: block.text,
        },
        finish_reason: null,
      });
    } else if (block.type === "thinking") {
      // Skip thinking blocks in OpenAI response (not part of OpenAI spec)
      // But we could optionally include as a custom field
      continue;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        index: toolCalls.length,
        id: block.id,
        type: "function",
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input),
        },
      });
    }
  }

  // Build OpenAI response
  const openaiResponse = {
    id: id || `chatcmpl-${Math.random().toString(36).substring(2)}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [],
  };

  // If there are tool calls, create a choice with tool_calls
  if (toolCalls.length > 0) {
    openaiResponse.choices.push({
      index: 0,
      message: {
        role: "assistant",
        content: null,
        tool_calls: toolCalls,
      },
      finish_reason: finishReason,
    });
  } else if (openaiContent.length > 0) {
    // Regular text response
    openaiResponse.choices.push({
      index: 0,
      message: {
        role: "assistant",
        content: openaiContent[0].message.content,
      },
      finish_reason: finishReason,
    });
  } else {
    // Empty response
    openaiResponse.choices.push({
      index: 0,
      message: {
        role: "assistant",
        content: "",
      },
      finish_reason: finishReason,
    });
  }

  // Add usage information
  if (usage) {
    openaiResponse.usage = {
      prompt_tokens: usage.input_tokens || 0,
      completion_tokens: usage.output_tokens || 0,
      total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
      // Include cache info as custom fields
      cache_read_input_tokens: usage.cache_read_input_tokens || 0,
      cache_creation_input_tokens: usage.cache_creation_input_tokens || 0,
    };
  }

  return openaiResponse;
}

/**
 * Convert OpenAI streaming chunk to Anthropic streaming event
 *
 * @param {Object} openaiChunk - OpenAI streaming chunk
 * @returns {Object} Anthropic streaming event
 */
export function convertOpenAIStreamToAnthropic(openaiChunk) {
  // OpenAI streaming format:
  // data: {"id": "...", "object": "chat.completion.chunk", "choices": [...]}

  const choices = openaiChunk.choices || [];
  const firstChoice = choices[0] || {};
  const delta = firstChoice.delta || {};

  // Convert to Anthropic streaming event format
  const event = {
    type: "content_block_delta",
  };

  if (delta.content) {
    event.delta = {
      type: "text_delta",
      text: delta.content,
    };
  } else if (delta.tool_calls) {
    // Handle tool calls in streaming
    const toolCall = delta.tool_calls[0];
    event.delta = {
      type: "input_json_delta",
      name: toolCall.function?.name,
      arguments: toolCall.function?.arguments || "",
    };
  }

  return event;
}

/**
 * Convert Anthropic streaming event to OpenAI streaming chunk
 *
 * @param {Object} anthropicEvent - Anthropic streaming event
 * @param {string} model - The model name
 * @returns {Object} OpenAI streaming chunk
 */
export function convertAnthropicStreamToOpenAI(anthropicEvent, model) {
  const { type } = anthropicEvent;

  // OpenAI streaming chunk format
  const chunk = {
    id: `chatcmpl-${Math.random().toString(36).substring(2)}`,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [],
  };

  if (type === "content_block_start") {
    // Handle content block start
    const block = anthropicEvent.content_block;
    if (block.type === "text") {
      chunk.choices.push({
        index: 0,
        delta: { role: "assistant", content: "" },
        finish_reason: null,
      });
    } else if (block.type === "tool_use") {
      chunk.choices.push({
        index: 0,
        delta: {
          role: "assistant",
          tool_calls: [
            {
              index: 0,
              id: block.id,
              type: "function",
              function: {
                name: block.name,
                arguments: "",
              },
            },
          ],
        },
        finish_reason: null,
      });
    }
  } else if (type === "content_block_delta") {
    // Handle content block delta
    const delta = anthropicEvent.delta;
    if (delta.type === "text_delta") {
      chunk.choices.push({
        index: 0,
        delta: { content: delta.text },
        finish_reason: null,
      });
    } else if (delta.type === "input_json_delta") {
      chunk.choices.push({
        index: 0,
        delta: {
          tool_calls: [
            {
              index: 0,
              function: {
                arguments: delta.arguments,
              },
            },
          ],
        },
        finish_reason: null,
      });
    }
  } else if (type === "content_block_stop") {
    // Content block finished
    chunk.choices.push({
      index: 0,
      delta: {},
      finish_reason: null,
    });
  } else if (type === "message_delta") {
    // Message delta (usage, stop reason)
    if (anthropicEvent.delta?.stop_reason) {
      chunk.choices.push({
        index: 0,
        delta: {},
        finish_reason:
          anthropicEvent.delta.stop_reason === "end_turn"
            ? "stop"
            : anthropicEvent.delta.stop_reason === "max_tokens"
            ? "length"
            : "tool_calls",
      });
    }
  } else if (type === "message_stop") {
    // Final event
    chunk.choices.push({
      index: 0,
      delta: {},
      finish_reason: "stop",
    });
  }

  return chunk;
}

/**
 * Convert OpenAI function calling format to Anthropic tools format
 *
 * @param {Array} functions - OpenAI functions array
 * @returns {Array} Anthropic tools array
 */
export function convertOpenAIFunctionsToTools(functions) {
  if (!functions || functions.length === 0) return undefined;

  return functions.map((func) => ({
    name: func.name,
    description: func.description || "",
    input_schema: func.parameters || { type: "object", properties: {} },
  }));
}

/**
 * Convert Anthropic tools to OpenAI functions format
 *
 * @param {Array} tools - Anthropic tools array
 * @returns {Array} OpenAI functions array
 */
export function convertAnthropicToolsToOpenAI(tools) {
  if (!tools || tools.length === 0) return undefined;

  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description || "",
      parameters: tool.input_schema || { type: "object", properties: {} },
    },
  }));
}
