import { useEffect, useState } from 'react'
import { applyChatEvent, type ChatEvent, type ChatState } from '../../../shared/chat'

// Live transcript of one chat: the saved state plus events as they stream in
export function useChat(projectId: string, chatId: string): ChatState | undefined {
  const [state, setState] = useState<ChatState>()

  useEffect(() => {
    let active = true
    let loaded = false
    // Events that arrive before the saved transcript loads are applied after it
    const early: ChatEvent[] = []
    const unsubscribe = window.api.chat.onEvent((message) => {
      if (message.chatId !== chatId) return
      if (!loaded) early.push(message.event)
      else setState((current) => current && applyChatEvent(current, message.event))
    })
    window.api.chat.open(projectId, chatId).then((initial) => {
      if (!active) return
      loaded = true
      setState(early.reduce(applyChatEvent, initial))
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [projectId, chatId])

  return state
}
