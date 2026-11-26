import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import BoardExportModal from './components/BoardExportModal'
import ConnectBoardScreen from './components/ConnectBoardScreen'
import TrelloBoardShell from './components/TrelloBoardShell'
import { isTrelloModalContext, loadTrelloBoardFromPowerUp } from './utils/trello'

export default function App() {
  const isTrelloModal = isTrelloModalContext()
  const [board, setBoard] = useState(null)
  const [sourceLabel, setSourceLabel] = useState('')
  const [trelloClient, setTrelloClient] = useState(null)
  const [loading, setLoading] = useState(isTrelloModal)
  const [loadError, setLoadError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(true)

  useEffect(() => {
    if (!isTrelloModal) return

    let cancelled = false
    setLoading(true)
    loadTrelloBoardFromPowerUp()
      .then(({ board: liveBoard, t }) => {
        if (cancelled) return
        setBoard(liveBoard)
        setTrelloClient(t)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err?.message || 'Unable to load Trello board data.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isTrelloModal])

  if (isTrelloModal) {
    if (loading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-zinc-700">
          <Loader2 className="h-7 w-7 animate-spin text-[#1f6336]" />
          <p className="mt-3 text-sm font-medium">Loading your Trello board...</p>
        </div>
      )
    }

    if (loadError || !board) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center text-zinc-800">
          <p className="text-base font-semibold text-red-700">Failed to load Trello board</p>
          <p className="mt-1 text-sm text-zinc-600">{loadError || 'No board data returned.'}</p>
        </div>
      )
    }

    return (
      <BoardExportModal
        board={board}
        isTrelloModal={true}
        onClose={() => trelloClient?.closeModal?.()}
      />
    )
  }

  if (!board) {
    return (
      <ConnectBoardScreen
        onBoardLoaded={(loadedBoard, source) => {
          setBoard(loadedBoard)
          setSourceLabel(source)
          setIsModalOpen(true)
        }}
      />
    )
  }

  return (
    <TrelloBoardShell
      board={board}
      sourceLabel={sourceLabel}
      isModalOpen={isModalOpen}
      onOpenModal={() => setIsModalOpen(true)}
      onDisconnect={() => {
        setBoard(null)
        setSourceLabel('')
      }}
    >
      <BoardExportModal board={board} onClose={() => setIsModalOpen(false)} />
    </TrelloBoardShell>
  )
}
