// Turns agent tool calls into short, readable one-liners for the chat

const MAX_OUTPUT_CHARS = 8000

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined

export function describeTool(name: string, input: Record<string, unknown>): string {
  const path = str(input.file_path) ?? str(input.path) ?? str(input.notebook_path)
  switch (name) {
    case 'Bash':
      return str(input.command) ?? 'Run a command'
    case 'Read':
      return path ? `Read ${path}` : 'Read a file'
    case 'Write':
      return path ? `Write ${path}` : 'Write a file'
    case 'Edit':
    case 'MultiEdit':
    case 'NotebookEdit':
      return path ? `Edit ${path}` : 'Edit a file'
    case 'Glob':
      return str(input.pattern) ? `Find ${input.pattern}` : 'Find files'
    case 'Grep':
      return str(input.pattern) ? `Search for ${input.pattern}` : 'Search files'
    case 'WebFetch':
      return str(input.url) ? `Fetch ${input.url}` : 'Fetch a web page'
    case 'WebSearch':
      return str(input.query) ? `Search the web for ${input.query}` : 'Search the web'
    case 'Task':
    case 'Agent':
      return str(input.description) ?? 'Run a sub-agent'
    case 'TodoWrite':
      return 'Update the to-do list'
    case 'ExitPlanMode':
      return 'Approve the plan'
    default:
      return name.startsWith('mcp__') ? name.split('__').slice(1).join(' › ') : name
  }
}

// Flattens a tool_result's content (string or content blocks) to text, capped
export function toolResultText(content: unknown): string {
  let text = ''
  if (typeof content === 'string') text = content
  else if (Array.isArray(content)) {
    text = content
      .map((block) =>
        block && typeof block === 'object' && 'text' in block && typeof block.text === 'string'
          ? block.text
          : block && typeof block === 'object' && 'type' in block && block.type === 'image'
            ? '[image]'
            : ''
      )
      .join('\n')
  }
  return text.length > MAX_OUTPUT_CHARS
    ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n… (${text.length - MAX_OUTPUT_CHARS} more characters)`
    : text
}
