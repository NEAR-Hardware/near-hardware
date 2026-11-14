import { useCallback, useEffect, useState } from 'react'
import {
  accountKey,
  isImplicitAccount,
  type NearAccount,
  type NearAccounts,
  type NearBalance,
  type NearNetwork
} from '../../../shared/near'

// undefined while loading; null when NEAR couldn't be reached
export type Balances = Record<string, NearBalance | null | undefined>

export type NearAccountsState = {
  // undefined until the saved accounts have loaded
  data?: NearAccounts
  balances: Balances
  refreshBalances: () => void
  primary: (network: NearNetwork) => NearAccount | undefined
}

// The saved accounts, kept current across windows, with their balances
export function useNearAccounts({ withBalances = true } = {}): NearAccountsState {
  const [data, setData] = useState<NearAccounts>()
  const [balances, setBalances] = useState<Balances>({})

  useEffect(() => {
    window.api.near.list().then(setData)
    return window.api.near.onChange(() => window.api.near.list().then(setData))
  }, [])

  const fetchBalances = useCallback((accounts: NearAccount[]) => {
    for (const account of accounts) {
      const key = accountKey(account.network, account.accountId)
      const fetch = (retries: number): void => {
        window.api.near.balance(account.network, account.accountId).then((balance) => {
          // RPC servers can lag a few seconds behind a brand-new account
          if (balance && !balance.exists && !isImplicitAccount(account.accountId) && retries > 0) {
            setTimeout(() => fetch(retries - 1), 2000)
            return
          }
          setBalances((current) => ({ ...current, [key]: balance }))
        })
      }
      fetch(3)
    }
  }, [])

  useEffect(() => {
    if (withBalances && data) fetchBalances(data.accounts)
  }, [withBalances, data, fetchBalances])

  const refreshBalances = useCallback(() => {
    if (!data) return
    setBalances({})
    fetchBalances(data.accounts)
  }, [data, fetchBalances])

  const primary = useCallback(
    (network: NearNetwork) =>
      data?.accounts.find((a) => a.network === network && a.accountId === data.primary[network]),
    [data]
  )

  return { data, balances, refreshBalances, primary }
}
