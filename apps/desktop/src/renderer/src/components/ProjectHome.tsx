import { useEffect, useState } from 'react'
import { Layers, LoaderCircle, Plus } from 'lucide-react'
import {
  getEnvironment,
  type ConnectedEnvironment,
  type EnvironmentId
} from '../../../shared/environments'
import type { Project } from '../../../shared/projects'
import { revealLabel } from '../format'
import AgentIcon from './AgentIcon'
import './ProjectView.css'

const LAST_ENVIRONMENT_KEY = 'near-hardware.last-environment'

function readLastEnvironment(): string | null {
  try {
    return localStorage.getItem(LAST_ENVIRONMENT_KEY)
  } catch {
    return null
  }
}

type ProjectHomeProps = {
  project: Project
  onCreateChat: (environmentId: EnvironmentId) => Promise<void>
  onOpenEnvironments: () => void
}

function ProjectHome({
  project,
  onCreateChat,
  onOpenEnvironments
}: ProjectHomeProps): React.JSX.Element | null {
  const [connected, setConnected] = useState<ConnectedEnvironment[]>()
  const [choice, setChoice] = useState<EnvironmentId | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    window.api.environments.listConnected().then((list) => {
      setConnected(list)
      // Default to the agent used last, if it's still connected
      const last = readLastEnvironment()
      setChoice(list.find((e) => e.id === last)?.id ?? list[0]?.id ?? null)
    })
  }, [])

  const create = async (): Promise<void> => {
    if (!choice || busy) return
    setBusy(true)
    try {
      localStorage.setItem(LAST_ENVIRONMENT_KEY, choice)
    } catch {
      // Only a convenience
    }
    try {
      await onCreateChat(choice)
    } finally {
      setBusy(false)
    }
  }

  if (!connected) return null

  return (
    <div className="project-home">
      <header className="project-home-header">
        <h1>{project.name}</h1>
        <button
          className="project-path"
          title={revealLabel()}
          onClick={() => window.api.projects.reveal(project.id)}
        >
          <code>{project.path}</code>
        </button>
      </header>

      <section className="start-chat">
        <h2>Start a chat</h2>
        {connected.length === 0 ? (
          <>
            <p>Connect a coding agent first. Chats run with one of your connected environments.</p>
            <div>
              <button className="btn primary" onClick={onOpenEnvironments}>
                <Layers size={14} strokeWidth={1.75} /> Go to Environments
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Pick which connected agent works in this project&apos;s folder.</p>
            <div className="agent-choices" role="radiogroup" aria-label="Environment">
              {connected.map((environment) => (
                <button
                  key={environment.id}
                  role="radio"
                  aria-checked={choice === environment.id}
                  className={`agent-choice${choice === environment.id ? ' checked' : ''}`}
                  onClick={() => setChoice(environment.id)}
                  onDoubleClick={create}
                >
                  <AgentIcon id={environment.id} size={14} />
                  <span className="agent-choice-name">{getEnvironment(environment.id).name}</span>
                  {environment.version && (
                    <span className="agent-choice-version">v{environment.version}</span>
                  )}
                </button>
              ))}
            </div>
            <div>
              <button className="btn primary" onClick={create} disabled={!choice || busy}>
                {busy ? (
                  <LoaderCircle size={14} className="spin" />
                ) : (
                  <Plus size={14} strokeWidth={2} />
                )}
                New chat
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default ProjectHome
