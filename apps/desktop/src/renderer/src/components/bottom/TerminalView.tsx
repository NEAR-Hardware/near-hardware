import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

// A shell in the project folder, kept alive while the panel is collapsed
function TerminalView({
  projectId,
  visible
}: {
  projectId: string
  visible: boolean
}): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const fitRef = useRef<FitAddon>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const terminal = new Terminal({
      // Nerd Font fallbacks draw prompt icons (Powerlevel10k, Starship) instead of boxes
      fontFamily:
        "ui-monospace, 'SF Mono', Menlo, Consolas, 'Symbols Nerd Font Mono', 'JetBrainsMono Nerd Font Mono', 'JetBrainsMono Nerd Font', 'MesloLGS NF', 'MesloLGS Nerd Font', 'Hack Nerd Font', 'FiraCode Nerd Font', monospace",
      fontSize: 12.5,
      cursorBlink: true,
      theme: {
        background: '#161616',
        foreground: '#e6e6e6',
        cursor: '#ff6a1a',
        selectionBackground: '#ff6a1a55'
      }
    })
    const fit = new FitAddon()
    fitRef.current = fit
    terminal.loadAddon(fit)
    terminal.open(host)
    fit.fit()

    let id: string | undefined
    let disposed = false
    const offData = window.api.terminal.onData((event) => {
      if (event.id === id) terminal.write(event.data)
    })
    const offExit = window.api.terminal.onExit((event) => {
      if (event.id === id) terminal.write('\r\n[process exited]\r\n')
    })
    window.api.terminal.create(projectId, terminal.cols, terminal.rows).then((created) => {
      if (disposed) window.api.terminal.kill(created)
      else id = created
    })
    const input = terminal.onData((data) => id && window.api.terminal.write(id, data))
    const resize = terminal.onResize(
      ({ cols, rows }) => id && window.api.terminal.resize(id, cols, rows)
    )
    const observer = new ResizeObserver(() => {
      if (host.offsetHeight > 0) fit.fit()
    })
    observer.observe(host)

    return () => {
      disposed = true
      observer.disconnect()
      input.dispose()
      resize.dispose()
      offData()
      offExit()
      if (id) window.api.terminal.kill(id)
      terminal.dispose()
    }
  }, [projectId])

  useEffect(() => {
    if (visible) requestAnimationFrame(() => fitRef.current?.fit())
  }, [visible])

  return <div ref={hostRef} className="terminal-host" />
}

export default TerminalView
