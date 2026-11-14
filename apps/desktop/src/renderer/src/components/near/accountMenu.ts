import { explorerUrl, type NearAccount } from '../../../../shared/near'
import type { MenuItemSpec } from '../../../../shared/projects'

// An account's native menu: the shared actions run here, anything else
// (e.g. 'reveal', 'remove', 'open') is returned for the caller to handle
export async function showAccountMenu(
  account: NearAccount,
  primary: boolean,
  extra: MenuItemSpec[]
): Promise<string | null> {
  const { network, accountId } = account
  const choice = await window.api.showMenu([
    // A limited account can't be the default signer: it can't send NEAR
    ...(primary || account.limited ? [] : [{ id: 'primary', label: 'Make Primary' }]),
    { id: 'copy', label: 'Copy Account ID' },
    { id: 'shuffle', label: 'Shuffle Avatar' },
    { id: 'explorer', label: 'View on NearBlocks' },
    ...(extra.length ? [{ type: 'separator' as const }, ...extra] : [])
  ])
  if (choice === 'primary') await window.api.near.setPrimary(network, accountId)
  else if (choice === 'copy') await navigator.clipboard.writeText(accountId)
  else if (choice === 'shuffle') await window.api.near.shuffleAvatar(network, accountId)
  else if (choice === 'explorer') window.open(explorerUrl(network, accountId))
  else return choice
  return null
}
