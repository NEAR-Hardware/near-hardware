import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bot,
  Check,
  CircuitBoard,
  Code,
  Cpu,
  Download,
  ExternalLink,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Info,
  LoaderCircle,
  LogIn,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  SquareTerminal,
  TriangleAlert,
  Usb,
  Wallet,
  Wrench,
  X
} from 'lucide-react'
import logo from '../../../../../resources/icon.png'
import {
  ENVIRONMENTS,
  type AuthStatus,
  type EnvironmentDefinition,
  type EnvironmentId,
  type EnvironmentStatus
} from '../../../../shared/environments'
import {
  METEOR_WALLET_URL,
  accountKey,
  formatNear,
  type NearAccount
} from '../../../../shared/near'
import type { SetupState } from '../../../../shared/setup'
import { useNearAccounts, type Balances } from '../../hooks/useNearAccounts'
import { CONTRACT_TOOLS, formatGB, lowDisk, useContractTools } from '../../hooks/useContractTools'
import { usePlatformio, type Platformio } from '../../hooks/usePlatformio'
import { rememberNewProject } from './pendingNewProject'
import AgentIcon from '../AgentIcon'
import TerminalView from '../bottom/TerminalView'
import AccountAvatar from '../near/AccountAvatar'
import CreateTestnetForm from '../near/CreateTestnetForm'
import ImportAccountForm from '../near/ImportAccountForm'
import '../near/Near.css'
import './Setup.css'

type StepId = 'welcome' | 'mac' | 'agents' | 'near' | 'contracts' | 'platformio' | 'folder' | 'tour'

const STEPS: { id: StepId; title: string }[] = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'mac', title: 'This Mac' },
  { id: 'agents', title: 'Coding agent' },
  { id: 'near', title: 'NEAR accounts' },
  { id: 'contracts', title: 'Smart contracts' },
  { id: 'platformio', title: 'PlatformIO' },
  { id: 'folder', title: 'Projects folder' },
  { id: 'tour', title: 'How it works' }
]

// The current step survives a relaunch, e.g. after Move to Applications
const STEP_KEY = 'near-hardware.setup-step'

function loadStep(): number {
  try {
    return Math.max(
      0,
      STEPS.findIndex((s) => s.id === localStorage.getItem(STEP_KEY))
    )
  } catch {
    return 0
  }
}

function saveStep(id: StepId | null): void {
  try {
    if (id) localStorage.setItem(STEP_KEY, id)
    else localStorage.removeItem(STEP_KEY)
  } catch {
    // Storage unavailable: the guide starts from the top next time
  }
}

type SetupGuideProps = {
  hasProjects: boolean
  // newProject: the user picked "Create your first project" at the end
  onDone: (newProject: boolean) => void
}

// First-run guide from install to a working setup: this Mac, a coding agent,
// PlatformIO and the projects folder, then a tour of the app
function SetupGuide({ hasProjects, onDone }: SetupGuideProps): React.JSX.Element {
  const [index, setIndex] = useState(loadStep)
  const [mac, setMac] = useState<SetupState>()
  const [agentsReady, setAgentsReady] = useState(false)
  const platformio = usePlatformio()
  const near = useNearAccounts()
  const contractTools = useContractTools()
  const [folder, setFolder] = useState<string>()
  const [folderReady, setFolderReady] = useState(false)
  const [folderError, setFolderError] = useState<{ message: string; blocked: boolean }>()
  const [busy, setBusy] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const refreshMac = useCallback(() => window.api.setup.state().then(setMac), [])
  useEffect(() => {
    refreshMac()
    window.api.projects.defaultLocation().then(setFolder)
    // Until the agent step checks sign-in, a connected agent counts as done
    window.api.environments.listConnected().then((list) => setAgentsReady(list.length > 0))
  }, [refreshMac])

  // Each step starts at the top. (scrollTo returns a promise in Chromium, so
  // it mustn't be the effect's return value.)
  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0)
  }, [index])

  const step = STEPS[index].id
  // Moving into Applications is offered at the end, so the relaunch doesn't cut the guide short
  const offerMove = !!mac?.packaged && !mac.inApplications
  const [moveOnFinish, setMoveOnFinish] = useState(true)
  const [moveFailed, setMoveFailed] = useState(false)
  const done: Record<StepId, boolean> = {
    welcome: index > 0,
    mac: !!mac?.devTools,
    agents: agentsReady,
    near: !!near.data?.accounts.length,
    contracts: !!contractTools.status && !contractTools.status.installCommand,
    platformio: !!platformio.status?.installed,
    folder: folderReady,
    tour: false
  }

  useEffect(() => saveStep(STEPS[index].id), [index])

  // canMove: only the last step's buttons move the app, not "Skip setup"
  const finish = async (newProject: boolean, canMove = false): Promise<void> => {
    await window.api.setup.complete()
    saveStep(null)
    if (canMove && offerMove && moveOnFinish) {
      rememberNewProject(newProject)
      // On success the app quits here and reopens from Applications
      if (await window.api.setup.moveToApplications()) return
      rememberNewProject(false)
      setMoveFailed(true)
      setMoveOnFinish(false)
      return
    }
    onDone(newProject)
  }
  const next = (): void => setIndex((i) => Math.min(i + 1, STEPS.length - 1))

  const prepareFolder = async (): Promise<void> => {
    if (!folder) return
    setBusy(true)
    setFolderError(undefined)
    try {
      const result = await window.api.setup.prepareProjectsFolder(folder)
      if (result.ok) {
        setFolderReady(true)
        next()
      } else {
        setFolderError({ message: result.message, blocked: result.blocked })
      }
    } finally {
      setBusy(false)
    }
  }

  // The footer's main button for each step; steps that aren't done yet can be skipped
  let primary: { label: string; onClick: () => void; disabled?: boolean }
  let skip = false
  switch (step) {
    case 'welcome':
      primary = { label: 'Get started', onClick: next }
      break
    case 'folder':
      primary = { label: 'Use this folder', onClick: prepareFolder, disabled: busy || !folder }
      break
    case 'tour':
      primary = hasProjects
        ? { label: 'Start building', onClick: () => finish(false, true) }
        : { label: 'Create your first project', onClick: () => finish(true, true) }
      break
    default:
      primary = { label: 'Continue', onClick: next, disabled: !done[step] }
      skip = !done[step]
  }

  return (
    <div className="setup" role="dialog" aria-label="Set up NEAR Hardware">
      <aside className="setup-rail">
        <div className="setup-brand">
          <img src={logo} alt="" />
          <div>
            <div className="setup-brand-name">NEAR Hardware</div>
            <div className="setup-brand-sub">Setup</div>
          </div>
        </div>
        <ol className="setup-steps">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                className={`setup-step${i === index ? ' current' : ''}${done[s.id] ? ' done' : ''}`}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => setIndex(i)}
              >
                <span className="setup-step-mark">
                  {done[s.id] ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                </span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
        <div className="setup-rail-footer">
          <button className="btn small ghost" onClick={() => finish(false)}>
            {mac?.completed ? 'Close guide' : 'Skip setup'}
          </button>
        </div>
      </aside>

      <main className="setup-main">
        <div className="setup-titlebar" />
        <div className="setup-body" ref={bodyRef}>
          <div className="setup-content">
            {step === 'welcome' && <WelcomeStep />}
            {step === 'mac' && <MacStep state={mac} onRefresh={refreshMac} />}
            {step === 'agents' && <AgentsStep onReadyChange={setAgentsReady} />}
            {step === 'near' && (
              <NearStep
                testnet={near.primary('testnet')}
                mainnet={near.primary('mainnet')}
                balances={near.balances}
              />
            )}
            {step === 'contracts' && <ContractsStep tools={contractTools} />}
            {step === 'platformio' && (
              <PlatformioStep platformio={platformio} devTools={!!mac?.devTools} />
            )}
            {step === 'folder' && (
              <FolderStep
                folder={folder}
                error={folderError}
                onChange={(path) => {
                  setFolder(path)
                  setFolderReady(false)
                  setFolderError(undefined)
                }}
              />
            )}
            {step === 'tour' && (
              <TourStep
                offerMove={offerMove}
                move={moveOnFinish}
                moveFailed={moveFailed}
                onMoveChange={setMoveOnFinish}
              />
            )}
          </div>
        </div>
        <footer className="setup-footer">
          <div className="setup-footer-inner">
            {index > 0 && (
              <button className="btn" onClick={() => setIndex(index - 1)}>
                Back
              </button>
            )}
            <span className="setup-footer-spacer" />
            {skip && (
              <button className="btn ghost" onClick={next}>
                Skip for now
              </button>
            )}
            {step === 'tour' && !hasProjects && (
              <button className="btn ghost" onClick={() => finish(false, true)}>
                Finish
              </button>
            )}
            <button className="btn primary" onClick={primary.onClick} disabled={primary.disabled}>
              {busy && <LoaderCircle size={13} className="spin" />}
              {primary.label}
            </button>
          </div>
        </footer>
      </main>
    </div>
  )
}

function WelcomeStep(): React.JSX.Element {
  return (
    <>
      <img className="setup-hero" src={logo} alt="" />
      <h1>Welcome to NEAR Hardware</h1>
      <p className="setup-lead">
        Build hardware with the coding agent you already use. Tell it which board you have: it reads
        the manufacturer&apos;s docs, writes the firmware, flashes the board and checks that it
        works.
      </p>
      <div className="setup-list">
        <Row icon={<Bot size={17} />} title="Your agent does the work">
          Claude Code, Codex, Cursor or OpenCode, signed in with your own account.
        </Row>
        <Row icon={<Cpu size={17} />} title="Almost any board">
          ESP32, Raspberry Pi Pico, STM32, Arduino and 1,500+ more through PlatformIO.
        </Row>
        <Row icon={<MonitorSmartphone size={17} />} title="See it before you flash">
          A live preview of the board&apos;s screen, and a wiring map of its pins and parts.
        </Row>
        <Row icon={<Wallet size={17} />} title="NEAR built in">
          Your boards and agents get NEAR accounts to pay, get paid and sign, on testnet or mainnet.
        </Row>
      </div>
      <Note icon={<Download size={15} />}>
        Setup takes about five minutes. Nothing heavy comes bundled with the app: it downloads only
        what your boards need, when they need it.
      </Note>
    </>
  )
}

function MacStep({
  state,
  onRefresh
}: {
  state?: SetupState
  onRefresh: () => Promise<void>
}): React.JSX.Element {
  const [waiting, setWaiting] = useState(false)

  const installing = waiting && !state?.devTools

  // Apple's installer runs on its own; check every few seconds until it's done
  useEffect(() => {
    if (!installing) return
    const timer = setInterval(onRefresh, 3000)
    return () => clearInterval(timer)
  }, [installing, onRefresh])

  const installDevTools = async (): Promise<void> => {
    setWaiting(true)
    await window.api.setup.installDevTools()
  }

  return (
    <>
      <h1>Get this Mac ready</h1>
      <p className="setup-lead">
        What NEAR Hardware needs from macOS before it can build firmware.
      </p>
      <div className="setup-list">
        <Row
          icon={<Wrench size={17} />}
          title="Apple’s Command Line Tools"
          action={
            !state ? (
              <LoaderCircle size={14} className="spin" />
            ) : state.devTools ? (
              <Done label="Installed" />
            ) : installing ? (
              <span className="setup-status">
                <LoaderCircle size={13} className="spin" /> Installing…
              </span>
            ) : (
              <button className="btn small primary" onClick={installDevTools}>
                Install
              </button>
            )
          }
        >
          git, to download official board examples, and Python, to install PlatformIO. A free
          download from Apple.
          {installing && ' Follow Apple’s installer window; this finishes on its own.'}
        </Row>
      </div>
      <h2>What macOS may ask you</h2>
      <div className="setup-list">
        <Row icon={<FolderOpen size={17} />} title="Documents folder">
          Asked once, when NEAR Hardware creates your projects folder. Click Allow so you and your
          agent can work on project files.
        </Row>
        <Row icon={<Bot size={17} />} title="Other folders">
          Your agent runs inside NEAR Hardware, so if it opens your Desktop or Downloads, macOS asks
          in NEAR Hardware&apos;s name.
        </Row>
        <Row icon={<Usb size={17} />} title="USB boards">
          No prompt. Boards on USB work without extra permissions.
        </Row>
      </div>
    </>
  )
}

type Job = { key: number; agent: EnvironmentId; title: string; command: string }

function AgentsStep({
  onReadyChange
}: {
  onReadyChange: (ready: boolean) => void
}): React.JSX.Element {
  const [statuses, setStatuses] = useState<Partial<Record<EnvironmentId, EnvironmentStatus>>>({})
  const [auth, setAuth] = useState<Partial<Record<EnvironmentId, AuthStatus>>>({})
  const [scanning, setScanning] = useState(true)
  const [job, setJob] = useState<Job>()
  const [exitCode, setExitCode] = useState<number>()
  const jobCount = useRef(0)

  // `scanning` starts true, so the first scan doesn't need to set it
  const scan = useCallback(
    () =>
      Promise.all([
        window.api.environments.detectAll(),
        window.api.environments.listConnected()
      ]).then(async ([results, saved]) => {
        setStatuses(Object.fromEntries(results.map((s) => [s.id, s])))
        // Installed agents are connected right away so new projects can use them
        // (Cursor only once its agent CLI is there)
        const connected = new Set(saved.map((e) => e.id))
        for (const status of results) {
          const runnable = status.installed && (status.id !== 'cursor' || !!status.agentCliPath)
          if (runnable && !connected.has(status.id))
            await window.api.environments.connect(status.id)
        }
        setScanning(false)
        // Sign-in checks take a moment each; fill them in as they come back
        for (const status of results.filter((s) => s.installed)) {
          window.api.environments
            .authStatus(status.id)
            .then((result) => setAuth((current) => ({ ...current, [status.id]: result })))
        }
      }),
    []
  )

  useEffect(() => {
    scan()
  }, [scan])

  const rescan = (): void => {
    setScanning(true)
    scan()
  }

  const usable = (id: EnvironmentId): boolean => {
    const status = statuses[id]
    if (!status?.installed || auth[id] === undefined || auth[id] === 'signed-out') return false
    // NEAR Hardware drives Cursor through its agent CLI, not the editor
    return id !== 'cursor' || !!status.agentCliPath
  }
  const ready = ENVIRONMENTS.some((d) => usable(d.id))
  useEffect(() => {
    onReadyChange(ready)
  }, [ready, onReadyChange])

  const run = (definition: EnvironmentDefinition, kind: 'install' | 'sign-in'): void => {
    const status = statuses[definition.id]
    const signIn =
      definition.id === 'cursor' && status?.agentCliPath
        ? `'${status.agentCliPath}' login`
        : definition.signInCommand
    setExitCode(undefined)
    setJob({
      key: ++jobCount.current,
      agent: definition.id,
      title: `${kind === 'install' ? 'Installing' : 'Signing in to'} ${definition.name}`,
      command: kind === 'install' ? definition.installCommand : signIn
    })
  }

  return (
    <>
      <h1>Connect a coding agent</h1>
      <p className="setup-lead">
        NEAR Hardware doesn&apos;t come with its own AI. It works through a coding agent on this
        Mac, signed in with your own account. You need at least one.
      </p>
      <div className="setup-list">
        {ENVIRONMENTS.map((definition) => {
          const status = statuses[definition.id]
          const signedIn = auth[definition.id]
          const needsCursorCli =
            definition.id === 'cursor' && status?.installed && !status.agentCliPath
          let detail: string
          let action: React.ReactNode
          if (!status) {
            detail = 'Checking…'
            action = <LoaderCircle size={14} className="spin" />
          } else if (!status.installed) {
            detail = definition.description
            action = (
              <button className="btn small" onClick={() => run(definition, 'install')}>
                <Download size={12} /> Install
              </button>
            )
          } else if (needsCursorCli) {
            detail = 'The Cursor app is installed, but not its agent CLI, which NEAR Hardware uses.'
            action = (
              <button className="btn small" onClick={() => run(definition, 'install')}>
                <Download size={12} /> Install CLI
              </button>
            )
          } else if (signedIn === 'signed-out') {
            detail = `${version(status)}Not signed in`
            action = (
              <button className="btn small primary" onClick={() => run(definition, 'sign-in')}>
                <LogIn size={12} /> Sign in
              </button>
            )
          } else if (signedIn === undefined) {
            detail = `${version(status)}Checking sign-in…`
            action = <LoaderCircle size={14} className="spin" />
          } else {
            detail = `${version(status)}${SIGN_IN_LABEL[signedIn]}`
            action = <Done label="Ready" />
          }
          return (
            <Row
              key={definition.id}
              icon={<AgentIcon id={definition.id} size={16} />}
              title={`${definition.name} · ${definition.vendor}`}
              action={action}
              plainIcon
            >
              {detail}
            </Row>
          )
        })}
      </div>
      {job && (
        <div className="setup-terminal">
          <div className="setup-terminal-header">
            <SquareTerminal size={14} />
            <span className="setup-terminal-title">{job.title}</span>
            {exitCode === undefined ? (
              <span className="setup-status">
                <LoaderCircle size={12} className="spin" /> Running
              </span>
            ) : (
              <span className={`setup-status${exitCode === 0 ? ' ok' : ' failed'}`}>
                {exitCode === 0 ? 'Finished' : `Stopped (exit code ${exitCode})`}
              </span>
            )}
            <button
              className="icon-button"
              aria-label="Close terminal"
              title="Close"
              onClick={() => setJob(undefined)}
            >
              <X size={14} />
            </button>
          </div>
          <div className="setup-terminal-body">
            <TerminalView
              key={job.key}
              projectId={null}
              command={job.command}
              visible
              onExit={(code) => {
                setExitCode(code)
                rescan()
              }}
            />
          </div>
        </div>
      )}
      <div className="setup-inline-actions">
        <button className="btn small ghost" onClick={rescan} disabled={scanning}>
          <RefreshCw size={12} className={scanning ? 'spin' : undefined} /> Check again
        </button>
        <span className="setup-hint">
          Installs and sign-ins use each agent&apos;s official command. Answer any questions it asks
          in the terminal.
        </span>
      </div>
    </>
  )
}

function NearStep({
  testnet,
  mainnet,
  balances
}: {
  testnet?: NearAccount
  mainnet?: NearAccount
  balances: Balances
}): React.JSX.Element {
  const [importTestnet, setImportTestnet] = useState(false)

  const ready = (account: NearAccount): React.JSX.Element => {
    const balance = balances[accountKey(account.network, account.accountId)]
    return (
      <div className="setup-list">
        <Row
          icon={
            <AccountAvatar
              accountId={account.accountId}
              variant={account.avatarVariant}
              size={32}
            />
          }
          title={account.accountId}
          action={<Done label="Ready" />}
          plainIcon
        >
          {balance ? `${formatNear(balance.total)} NEAR · ` : ''}
          Your primary {account.network} account. Add more any time from the sidebar.
        </Row>
      </div>
    )
  }

  return (
    <>
      <h1>Set up your NEAR accounts</h1>
      <p className="setup-lead">
        Your boards and agents use NEAR accounts to pay, get paid and sign. Start with a free
        testnet account to try things; add a mainnet account for real NEAR now or later.
      </p>

      <h2>Testnet · free test NEAR</h2>
      {testnet ? (
        ready(testnet)
      ) : importTestnet ? (
        <div className="setup-card">
          <ImportAccountForm
            network="testnet"
            onImported={() => setImportTestnet(false)}
            onCancel={() => setImportTestnet(false)}
          />
        </div>
      ) : (
        <div className="setup-card">
          <CreateTestnetForm onCreated={() => undefined} />
          <button className="link-button" onClick={() => setImportTestnet(true)}>
            Import a testnet account you already have
          </button>
        </div>
      )}

      <h2>Mainnet · real NEAR</h2>
      {mainnet ? (
        ready(mainnet)
      ) : (
        <>
          <div className="setup-list">
            <Row
              icon={<span className="setup-step-number">1</span>}
              title="Get a free name in Meteor Wallet"
              action={
                <a className="btn small" href={METEOR_WALLET_URL} target="_blank" rel="noreferrer">
                  Open Meteor <ExternalLink size={12} />
                </a>
              }
            >
              Create an account like alice.near. Meteor pays the small fee a name costs on NEAR.
              Save the recovery phrase it gives you.
            </Row>
            <Row icon={<span className="setup-step-number">2</span>} title="Bring it here">
              Paste its recovery phrase or private key below. NEAR Hardware finds the account.
            </Row>
          </div>
          <div className="setup-card">
            <ImportAccountForm network="mainnet" onImported={() => undefined} />
          </div>
        </>
      )}
      <Note icon={<ShieldCheck size={15} />}>
        Keys are encrypted with your Mac&apos;s Keychain and never leave this Mac. For mainnet, use
        an account just for hardware, not the one with your savings.
      </Note>
    </>
  )
}

function ContractsStep({
  tools
}: {
  tools: ReturnType<typeof useContractTools>
}): React.JSX.Element {
  const { status, checking, refresh, job, install, finishJob, closeJob, exitCode } = tools
  return (
    <>
      <h1>Tools for NEAR smart contracts</h1>
      <p className="setup-lead">
        Your agent writes NEAR contracts in Rust, builds them and deploys them with your NEAR
        accounts. These are the official tools from the Rust project and NEAR.
      </p>
      <div className="setup-list">
        {CONTRACT_TOOLS.map(({ key, name, about }) => {
          const tool = status?.[key]
          return (
            <Row
              key={key}
              icon={<Code size={17} />}
              title={name}
              action={
                !tool ? (
                  <LoaderCircle size={14} className="spin" />
                ) : tool.installed ? (
                  <Done label={`Installed${tool.version ? ` · v${tool.version}` : ''}`} />
                ) : (
                  <span className="setup-status">Not installed</span>
                )
              }
            >
              {about}
            </Row>
          )
        })}
      </div>
      {lowDisk(status) && (
        <Note icon={<TriangleAlert size={15} />} warning>
          Only {formatGB(status!.freeBytes!)} free on this Mac. Rust needs about 1 GB, and each
          contract&apos;s first build needs another 2–3 GB. Free up some space first.
        </Note>
      )}
      {status?.installCommand && !job && (
        <div className="setup-inline-actions">
          <button className="btn primary" onClick={install}>
            <Download size={13} /> Install missing tools
          </button>
          <span className="setup-hint">
            About 1 GB. Runs the official installers in a terminal below.
          </span>
        </div>
      )}
      {job && (
        <div className="setup-terminal">
          <div className="setup-terminal-header">
            <SquareTerminal size={14} />
            <span className="setup-terminal-title">Installing NEAR contract tools</span>
            {exitCode === undefined ? (
              <span className="setup-status">
                <LoaderCircle size={12} className="spin" /> Running
              </span>
            ) : (
              <span className={`setup-status${exitCode === 0 ? ' ok' : ' failed'}`}>
                {exitCode === 0 ? 'Finished' : `Stopped (exit code ${exitCode})`}
              </span>
            )}
            <button
              className="icon-button"
              aria-label="Close terminal"
              title="Close"
              onClick={closeJob}
            >
              <X size={14} />
            </button>
          </div>
          <div className="setup-terminal-body">
            <TerminalView
              key={job.key}
              projectId={null}
              command={job.command}
              visible
              onExit={finishJob}
            />
          </div>
        </div>
      )}
      <div className="setup-inline-actions">
        <button className="btn small ghost" onClick={refresh} disabled={checking}>
          <RefreshCw size={12} className={checking ? 'spin' : undefined} /> Check again
        </button>
      </div>
      <Note icon={<Info size={15} />}>
        <span>
          Contracts pin their own Rust version, so the first build of a new contract downloads that
          version once (about 1 GB) and its build files take 1–2 GB in the project. NEAR&apos;s
          documentation also comes with the app: agents search it before writing NEAR code.
        </span>
      </Note>
    </>
  )
}

const SIGN_IN_LABEL: Record<Exclude<AuthStatus, 'signed-out'>, string> = {
  'signed-in': 'Signed in',
  'not-needed': 'Works without an account',
  unknown: 'Installed'
}

const version = (status: EnvironmentStatus): string =>
  status.version ? `v${status.version} · ` : ''

function PlatformioStep({
  platformio,
  devTools
}: {
  platformio: Platformio
  devTools: boolean
}): React.JSX.Element {
  const { status, installing, log, install } = platformio
  const logRef = useRef<HTMLPreElement>(null)
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  return (
    <>
      <h1>Install PlatformIO</h1>
      <p className="setup-lead">
        PlatformIO builds firmware and flashes it to your board. Your agent runs it for you; you can
        also use <code>pio</code> in the app&apos;s terminal.
      </p>
      <div className="setup-list">
        <Row
          icon={<Cpu size={17} />}
          title="PlatformIO Core"
          action={
            !status ? (
              <LoaderCircle size={14} className="spin" />
            ) : status.installed ? (
              <Done label={`Installed${status.version ? ` · v${status.version}` : ''}`} />
            ) : (
              <button className="btn small primary" onClick={install} disabled={installing}>
                {installing ? <LoaderCircle size={12} className="spin" /> : <Download size={12} />}
                {installing ? 'Installing…' : 'Install'}
              </button>
            )
          }
        >
          About 35 MB, from PlatformIO&apos;s official installer. Takes under a minute.
        </Row>
      </div>
      {!devTools && !status?.installed && (
        <Note icon={<TriangleAlert size={15} />} warning>
          The installer needs Python from Apple&apos;s Command Line Tools. Install them in the
          previous step first.
        </Note>
      )}
      {status?.error && (
        <Note icon={<TriangleAlert size={15} />} warning>
          {status.error}
        </Note>
      )}
      {log.length > 0 && (
        <pre ref={logRef} className="setup-log">
          {log.join('\n')}
        </pre>
      )}
      <Note icon={<Info size={15} />}>
        <span>
          <strong>What gets downloaded later:</strong> the first time you build for a new kind of
          chip, PlatformIO downloads its compiler once (a few GB for ESP32 boards). Libraries your
          project lists download automatically when it builds.
        </span>
      </Note>
    </>
  )
}

function FolderStep({
  folder,
  error,
  onChange
}: {
  folder?: string
  error?: { message: string; blocked: boolean }
  onChange: (path: string) => void
}): React.JSX.Element {
  const choose = async (): Promise<void> => {
    const chosen = await window.api.projects.chooseLocation(folder)
    if (chosen) onChange(chosen)
  }

  return (
    <>
      <h1>Choose a projects folder</h1>
      <p className="setup-lead">
        Each project is a folder with its firmware, board notes and screen designs. New projects go
        here; you can pick another place for any project later.
      </p>
      <div className="setup-path">
        <code title={folder}>{folder ?? '…'}</code>
        <button className="btn" onClick={choose}>
          Change…
        </button>
      </div>
      {folder?.includes('/Documents') && (
        <Note icon={<ShieldCheck size={15} />}>
          macOS will ask to let NEAR Hardware access your Documents folder. Click{' '}
          <strong>Allow</strong>: your agent reads and writes project files through the app.
        </Note>
      )}
      {error && (
        <Note icon={<TriangleAlert size={15} />} warning>
          <span>
            {error.message}{' '}
            {error.blocked && (
              <>
                Turn on access in System Settings, or choose another folder.{' '}
                <button
                  className="link-button"
                  onClick={() => window.api.setup.openPrivacySettings()}
                >
                  Open Privacy &amp; Security
                </button>
              </>
            )}
          </span>
        </Note>
      )}
    </>
  )
}

const TOUR: { icon: React.ReactNode; title: string; text: string }[] = [
  {
    icon: <FolderPlus size={17} />,
    title: 'Projects and chats',
    text: 'Create a project, then start a chat. Every chat begins with your board’s exact name: copy it from the manufacturer’s website.'
  },
  {
    icon: <Bot size={17} />,
    title: 'Your agent sets up the board',
    text: 'It finds the official docs and examples, writes BOARD.md and platformio.ini, then builds, flashes and checks the board.'
  },
  {
    icon: <ShieldCheck size={17} />,
    title: 'You stay in control',
    text: 'Approve each command and file change, or switch the chat’s mode to YOLO to approve everything.'
  },
  {
    icon: <Wallet size={17} />,
    title: 'NEAR accounts',
    text: 'Your primary mainnet and testnet accounts sit at the bottom of the sidebar. Click one to see every account, its balance and its keys.'
  },
  {
    icon: <MonitorSmartphone size={17} />,
    title: 'Screen preview',
    text: 'Boards with a display get a live preview of the agent’s screen designs. Pop it out into its own window.'
  },
  {
    icon: <CircuitBoard size={17} />,
    title: 'Pins and wiring',
    text: 'Switch a chat to Wiring to see every pin and how parts connect. Drag things around like a whiteboard.'
  }
]

function TourStep({
  offerMove,
  move,
  moveFailed,
  onMoveChange
}: {
  offerMove: boolean
  move: boolean
  moveFailed: boolean
  onMoveChange: (move: boolean) => void
}): React.JSX.Element {
  return (
    <>
      <h1>How NEAR Hardware works</h1>
      <p className="setup-lead">You&apos;re set up. Here&apos;s where everything lives.</p>
      <div className="setup-tour">
        {TOUR.map((item) => (
          <div key={item.title} className="setup-tour-card">
            <span className="setup-row-icon">{item.icon}</span>
            <div className="setup-row-title">{item.title}</div>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
      {offerMove && (
        <label className="setup-list setup-check">
          <Row
            icon={<HardDrive size={17} />}
            title="Move to Applications when I finish"
            action={
              <input
                type="checkbox"
                checked={move}
                onChange={(event) => onMoveChange(event.target.checked)}
              />
            }
          >
            {moveFailed
              ? 'Couldn’t move it. Drag NEAR Hardware into Applications in Finder instead.'
              : 'NEAR Hardware is running from your Downloads or the disk image. It moves itself to Applications and reopens, so it keeps working after you eject the disk image.'}
          </Row>
        </label>
      )}
      <p className="setup-hint">Open this guide again any time from Help › Setup Guide.</p>
    </>
  )
}

function Row({
  icon,
  title,
  action,
  plainIcon,
  children
}: {
  icon: React.ReactNode
  title: string
  action?: React.ReactNode
  // The icon brings its own tile (agent logos)
  plainIcon?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="setup-row">
      {plainIcon ? icon : <span className="setup-row-icon">{icon}</span>}
      <div className="setup-row-text">
        <div className="setup-row-title">{title}</div>
        <div className="setup-row-detail">{children}</div>
      </div>
      {action && <div className="setup-row-action">{action}</div>}
    </div>
  )
}

function Note({
  icon,
  warning,
  children
}: {
  icon: React.ReactNode
  warning?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className={`setup-note${warning ? ' warning' : ''}`}>
      {icon}
      <div>{children}</div>
    </div>
  )
}

const Done = ({ label }: { label: string }): React.JSX.Element => (
  <span className="setup-status ok">
    <Check size={13} strokeWidth={2.5} /> {label}
  </span>
)

export default SetupGuide
