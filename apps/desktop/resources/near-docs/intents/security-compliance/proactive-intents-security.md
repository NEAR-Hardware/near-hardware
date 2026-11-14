> ## Documentation Index
> Fetch the complete documentation index at: https://docs.near-intents.org/llms.txt
> Use this file to discover all available pages before exploring further.

# SHIELD: Proactive Intents Security

> How SHIELD proactively raises security posture across guarded NEAR Intents surfaces

SHIELD is the security policy layer behind NEAR Intents and the 1Click stack. It lets integrated services evaluate requests against incident state and shared security posture before continuing execution.

Instead of relying on a single global stop switch, SHIELD is built for scoped response. Today that means request-time decisions such as allow or delay on integrated flows, with broader orchestration expanding over time.

***

## Implementation status

Use this page as both a product direction overview and a status snapshot.

> [card] Live today
>
> Incident submission and resolution, scoped permissions, security modes, and quote-time evaluation decisions for integrated Shield consumers.

> [card] Rolling out
>
> Broader runtime adoption of Shield decisions across additional request paths and operational surfaces.

> [card] Vision
>
> Multi-surface posture orchestration informed by richer operational, transaction, and chain-health signals.

***

## Architecture

At its core, SHIELD is a dedicated incident and policy service. Authorized producers submit incidents, and integrated consumers query SHIELD to determine how a request should proceed.

This architecture supports graceful degradation by applying scoped policy decisions at request time instead of immediately shutting down the full platform.

> [card] Incident ingress
>
> One write surface for incident creation and resolution with authentication, scoped authorization checks, and auditable records.

> [card] Security mode
>
> Shared posture represented as coarse modes (`normal`, `paranoid`, `under_attack`) that integrated consumers can apply consistently.

> [card] Policy decisions
>
> Evaluate endpoints return scoped policy decisions based on incidents, posture, and configured thresholds.

### Guarded surfaces

SHIELD can coordinate security posture across multiple parts of the platform:

> [card] 1Click swaps
>
> Live today for integrated quote-time checks, including scoped delay.

> [card] Bridge
>
> Rolling out as Shield decisions are adopted across additional execution paths and bridge-touching flows.

> [card] Solver pool
>
> Vision: solver and liquidity controls can consume the same incident and posture model as integration expands.

> [card] Public status
>
> Live today through incident public descriptions that support partner-facing degraded-state messaging.

***

## Security Modes

SHIELD defines three operational modes. They are intentionally coarse so they are easy to reason about under pressure.

> [card] Normal
>
> No friction. This is the default operating state.

> [card] Paranoid
>
> Buy time. Add delay windows and increase operational scrutiny while the situation is assessed.

> [card] Under attack
>
> Pause affected functionality and monitor in depth while responders contain the incident.

> [!WARNING]
>
> The modes are designed to be simple on purpose. In an incident, operators benefit from clear posture changes more than they benefit from a large number of fine-grained states.

***

## Partner Permissions

The SHIELD signal bus is open to multiple producers, including partner integrations, on-call operators, internal anomaly detection, and internal tooling. Producers do not inherit capabilities automatically. Each producer receives an explicit permission set.

Typical capabilities include:

> [card] Pause a destination
>
> Pause a single chain, token, or destination without escalating the whole platform.

> [card] Flag observation
>
> Submit an observation for review without forcing a posture change.

> [card] Raise mode
>
> Move a scoped surface or the full platform into `paranoid` or `under_attack`.

> [card] Read-only
>
> Inspect status and history without changing platform posture.

These permissions are scoped. The model supports granular scope by chain, bridge, token, address, and security mode. Scope enforcement is rolling out incrementally. As newer request-evaluation paths adopt narrower chain-specific permissions, behavior may vary by integration path.

### Example permission models

> [card] Internal incident responder
>
> An internal on-call operator may be granted `raise mode` at platform scope so they can move the system into `paranoid` or `under_attack` while a real incident unfolds.

> [card] Consumer integration
>
> A partner integration may be granted per-chain scope, plus read-only access elsewhere, so it can pause a chain it cares about without escalating the global posture.

> [!WARNING]
>
> Capabilities are auditable in both directions. Partners can inspect their own action history, while internal operators can review the full action set by partner, scope, or effect.

***

## Anomaly Engine

SHIELD integrates a first-party anomaly engine as an additional decision input for quote evaluation.

The engine is rule-based and explainable rather than model-driven. It maps observed conditions to concrete decision outcomes.

> [card] Current behavior
>
> In current integration, anomaly scoring is applied on quote evaluation under configured thresholds and feature flags.

> [card] Severity mapping
>
> Elevated outcomes can increase friction (for example delay), while failures are handled defensively.

As integration expands, anomaly inputs can inform more surfaces beyond the current quote-centric path.

***

## Transaction and Account Monitoring

Proactive intent security is not only about chain-level conditions. It is also about identifying when a specific transaction, account, destination, or fund flow looks unusual in the context of the broader system.

SHIELD's policy model is designed to support transaction and account-level targeting across connected chains, including:

> [card] Transaction-level anomalies
>
> Today: integrated quote requests can be delayed based on incident and anomaly outcomes.

> [card] Account and destination risk
>
> Model support exists for scoped controls by recipient, sender, deposit address, and counterparties.

> [card] Suspicious flow of funds
>
> Rolling out: broader use of policy decisions across more end-to-end flow checkpoints.

> [card] Scoped response
>
> Vision: apply targeted friction to the transaction, account, route, or destination that needs attention without broad platform degradation.

This remains core to the SHIELD vision: proactive security should react not only to unhealthy chains, but also to suspicious activity tied to individual requests and participant accounts.

> [!NOTE]
>
> In practice, that means NEAR Intents can raise friction for a specific flow of funds while the rest of the system continues operating normally.

***

## Chain Health

Different chains fail in different ways. A proof-of-work chain may lose hashrate. A proof-of-stake chain may stall on finality. An L2 may fall behind its sequencer.

SHIELD is being designed around a normalized health model. The target state is chain-family adapters that emit a shared output at the policy boundary.

> [card] One health vocabulary
>
> Vision: each adapter answers shared practical questions such as block production, finality health, throughput envelope, and anomaly conditions.

> [card] Native adapters
>
> Vision: each chain family stays native to its own environment while translating to shared policy semantics.

Common adapter families include:

> [card] Bitcoin / PoW family
>
> Metrics such as hashrate and block cadence.

> [card] Ethereum / EVM family
>
> Metrics such as finality, reorgs, and mempool behavior.

> [card] NEAR / PoS family
>
> Metrics such as block production and validator health.

> [card] Other supported chains
>
> A family-specific adapter that translates chain-native signals into the shared health model.

> [!NOTE]
>
> Chain-health integration follows the same incident and policy model. As adapters are rolled out, they can feed incidents through shared authorization and audit paths.

***

## Incident API

SHIELD exposes two conceptual surfaces:

> [card] Status feed
>
> A read path for consumers who need a summary of current incidents and degraded conditions.

> [card] Incident submission
>
> A write path for authorized producers. Requests are authenticated and scope-checked before incident state is changed.

The public surface is intentionally narrow. Detailed schemas are shared through partner-facing reference materials, while this page explains the purpose of the system and the security model behind it.

> [card] [Shield Incident API](https://docs.near-intents.org/security-compliance/shield-incident-api.md)
>
> Partner-facing reference for pulling active incidents and submitting new ones — endpoints, auth, and scope.

***

## Summary

SHIELD gives NEAR Intents a proactive way to raise security posture before an issue becomes system-wide damage. Today it combines shipped controls with an explicit roadmap:

> [card] Implemented controls
>
> Incident management, scoped permissions, coarse security modes, and evaluate endpoints used by integrated consumers.

> [card] Scoped permissions
>
> Explicit producer capabilities instead of inherited authority.

> [card] Coarse security modes
>
> Simple postures that operators can apply quickly during an incident.

> [card] Roadmap-aligned vision
>
> Progressive expansion from quote-centric safeguards toward broader, surface-specific response across the platform.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.