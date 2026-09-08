import { useEffect } from 'react'

/** Ctrl+K on Windows/Linux, Cmd+K on macOS (ALLET_PLAN.md §6). */
export function useSearchShortcut(onOpen: () => void): void {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [onOpen])
}
