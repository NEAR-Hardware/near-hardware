// near-api-js pulls in is-my-json-valid (Contract ABI checks, unused here),
// which requires Node's "util". This stub keeps the bundle browser-only.
export const format = (...a: unknown[]) => a.map(String).join(" ");
export const inspect = (v: unknown) => JSON.stringify(v);
export default { format, inspect };
