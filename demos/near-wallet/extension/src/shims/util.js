// near-api-js pulls in is-my-json-valid (for Contract ABI checks, unused
// here), which requires Node's "util". This stub keeps the bundle browser-only.
export const format = (...a) => a.map(String).join(" ");
export const inspect = (v) => JSON.stringify(v);
export default { format, inspect };
