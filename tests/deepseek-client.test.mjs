import assert from "node:assert/strict";
import test from "node:test";

import {
  deepSeekRequestSettings,
  requestDeepSeekContent,
  retryDelayForAttempt,
  waitBeforeRetry,
} from "../scripts/deepseek-client.mjs";

const request = {
  apiUrl: "https://api.deepseek.test/chat/completions",
  apiKey: "test-key",
  model: "test-model",
  messages: [{ role: "user", content: "Test" }],
};

test("returns generated content from a successful DeepSeek response", async () => {
  const content = await requestDeepSeekContent({
    ...request,
    timeoutMs: 100,
    fetchImpl: async (_url, options) => {
      assert.ok(options.signal instanceof AbortSignal);
      return new Response(JSON.stringify({ choices: [{ message: { content: "{\"title\":\"Test\"}" } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  assert.equal(content, '{"title":"Test"}');
});

test("aborts a DeepSeek request that exceeds its timeout", async () => {
  await assert.rejects(
    requestDeepSeekContent({
      ...request,
      timeoutMs: 20,
      fetchImpl: async (_url, options) =>
        new Promise((_, reject) => {
          options.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
        }),
    }),
    /DeepSeek request timed out after 20 ms/,
  );
});

test("uses safe timeout defaults and accepts positive overrides", () => {
  assert.deepEqual(deepSeekRequestSettings({}), { timeoutMs: 120_000, retryDelayMs: 5_000 });
  assert.deepEqual(
    deepSeekRequestSettings({ DEEPSEEK_REQUEST_TIMEOUT_MS: "90000", DEEPSEEK_RETRY_DELAY_MS: "3000" }),
    { timeoutMs: 90_000, retryDelayMs: 3_000 },
  );
  assert.deepEqual(
    deepSeekRequestSettings({ DEEPSEEK_REQUEST_TIMEOUT_MS: "invalid", DEEPSEEK_RETRY_DELAY_MS: "0" }),
    { timeoutMs: 120_000, retryDelayMs: 5_000 },
  );
});

test("applies bounded linear backoff between generation attempts", async () => {
  const delays = [];
  assert.equal(retryDelayForAttempt(1, 5_000), 5_000);
  assert.equal(retryDelayForAttempt(2, 5_000), 10_000);
  await waitBeforeRetry(2, 5_000, async (delayMs) => delays.push(delayMs));
  assert.deepEqual(delays, [10_000]);
});
