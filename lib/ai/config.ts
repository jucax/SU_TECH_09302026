// Whether the Claude API features (plain-language updates, the accuracy check)
// can run in this deployment. The hosted demo does not configure a key, so the
// UI asks GET /api/monitor and shows those features as not enabled instead of
// letting a visitor hit an error.
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export const AI_NOT_ENABLED_MESSAGE =
  'AI features are not enabled in this hosted demo, so this request could not be read. ' +
  'The two preloaded updates still work, and hours and policies can be edited in Settings.'
