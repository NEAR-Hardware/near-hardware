import { useRef, useState } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'

function CodeBlock({ children }: React.ComponentProps<'pre'>): React.JSX.Element {
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(ref.current?.textContent ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="code-block">
      <button
        className="icon-button small code-copy"
        aria-label="Copy code"
        title={copied ? 'Copied' : 'Copy code'}
        onClick={copy}
      >
        {copied ? <Check size={13} /> : <Copy size={13} strokeWidth={1.5} />}
      </button>
      <pre ref={ref}>{children}</pre>
    </div>
  )
}

const COMPONENTS: Components = {
  // Links open in the system browser (the window open handler routes them there)
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>
}

function Markdown({ text }: { text: string }): React.JSX.Element {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  )
}

export default Markdown
