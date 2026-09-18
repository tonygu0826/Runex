const DEFAULT_REQUEST_TIMEOUT_MS = 120_000;
const DEFAULT_RETRY_DELAY_MS = 5_000;

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function deepSeekRequestSettings(env = process.env) {
  return {
    timeoutMs: positiveInteger(env.DEEPSEEK_REQUEST_TIMEOUT_MS, DEFAULT_REQUEST_TIMEOUT_MS),
    retryDelayMs: positiveInteger(env.DEEPSEEK_RETRY_DELAY_MS, DEFAULT_RETRY_DELAY_MS),
  };
}

export function retryDelayForAttempt(attempt, baseDelayMs) {
  return Math.max(0, attempt) * Math.max(0, baseDelayMs);
}

export async function waitBeforeRetry(attempt, baseDelayMs, sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs))) {
  const delayMs = retryDelayForAttempt(attempt, baseDelayMs);
  if (delayMs > 0) await sleep(delayMs);
  return delayMs;
}

export async function requestDeepSeekContent({
  apiUrl,
  apiKey,
  model,
  messages,
  maxTokens = 8_000,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  fetchImpl = fetch,
}) {
  const controller = new AbortController();
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`DeepSeek request timed out after ${timeoutMs} ms.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      (async () => {
        const response = await fetchImpl(apiUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages,
            thinking: { type: "disabled" },
            response_format: { type: "json_object" },
            max_tokens: maxTokens,
            temperature: 0.35,
            stream: false,
          }),
          signal: controller.signal,
        });
        // The same deadline covers headers AND the response body. A server can
        // send headers immediately and then stall while generating its answer.
        if (!response.ok) throw new Error(`DeepSeek request failed (${response.status}): ${(await response.text()).slice(0, 1_000)}`);
        const rawContent = (await response.json())?.choices?.[0]?.message?.content;
        if (typeof rawContent !== "string" || !rawContent.trim()) throw new Error("DeepSeek returned no article content.");
        return rawContent;
      })(),
      timeoutPromise,
    ]);
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`DeepSeek request timed out after ${timeoutMs} ms.`);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
