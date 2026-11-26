import { useEffect, useRef, useState } from 'react'
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileJson,
  KeyRound,
  LayoutGrid,
  Loader2,
  Puzzle,
  Upload,
} from 'lucide-react'
import {
  fetchFullTrelloBoard,
  fetchUserTrelloBoards,
  parseTrelloBoardJson,
} from '../utils/trello'

const STORAGE_KEY_API = 'board_export_trello_key'
const STORAGE_KEY_TOKEN = 'board_export_trello_token'

export default function ConnectBoardScreen({ onBoardLoaded }) {
  const [activeTab, setActiveTab] = useState('api')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY_API) || '')
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY_TOKEN) || '')
  const [rememberCreds, setRememberCreds] = useState(true)

  const [boards, setBoards] = useState([])
  const [loadingBoards, setLoadingBoards] = useState(false)
  const [loadingBoardId, setLoadingBoardId] = useState('')
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const fileInputRef = useRef(null)
  const connectorUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'

  useEffect(() => {
    if (apiKey && token && boards.length === 0) {
      handleFetchBoards(apiKey, token, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFetchBoards = async (keyOverride, tokenOverride, silent = false) => {
    const k = keyOverride ?? apiKey
    const t = tokenOverride ?? token
    setError('')
    setLoadingBoards(true)
    try {
      const list = await fetchUserTrelloBoards(k, t)
      setBoards(list)
      if (rememberCreds) {
        localStorage.setItem(STORAGE_KEY_API, k.trim())
        localStorage.setItem(STORAGE_KEY_TOKEN, t.trim())
      }
    } catch (err) {
      if (!silent) {
        setError(err?.message || 'Unable to connect to Trello.')
      }
    } finally {
      setLoadingBoards(false)
    }
  }

  const handleSelectBoard = async (boardId) => {
    setError('')
    setLoadingBoardId(boardId)
    try {
      const board = await fetchFullTrelloBoard(boardId, apiKey, token)
      onBoardLoaded(board, 'Trello API')
    } catch (err) {
      setError(err?.message || 'Failed to load board details.')
    } finally {
      setLoadingBoardId('')
    }
  }

  const handleClearCredentials = () => {
    localStorage.removeItem(STORAGE_KEY_API)
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    setApiKey('')
    setToken('')
    setBoards([])
    setError('')
  }

  const handleJsonFile = async (file) => {
    if (!file) return
    setError('')
    try {
      const text = await file.text()
      const board = parseTrelloBoardJson(text)
      onBoardLoaded(board, file.name)
    } catch (err) {
      setError(err?.message || 'Failed to read Trello JSON file.')
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(connectorUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 1800)
    } catch {
      // Clipboard API unavailable
    }
  }

  const authorizeTokenUrl = apiKey.trim()
    ? `https://trello.com/1/authorize?expiration=1day&name=Board%20Export&scope=read&response_type=token&key=${encodeURIComponent(
        apiKey.trim()
      )}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b4f6c] via-[#0d627a] to-[#147a74] p-4 sm:p-8">
      {/* Top Bar */}
      <header className="mx-auto mb-8 flex max-w-4xl items-center justify-between text-white">
        <div className="flex items-center gap-2.5 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <LayoutGrid className="h-4 w-4 text-sky-200" />
          </span>
          <span className="text-lg tracking-tight">Board Export for Trello</span>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">
          Live Trello Data Only
        </span>
      </header>

      <main className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xl">
        {/* Card Header */}
        <div className="border-b border-zinc-200 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <Download className="h-5 w-5 text-[#1f6336]" />
            <h1 className="text-xl font-bold text-zinc-900">Connect Your Trello Board</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-600">
            Load a real Trello board via API, upload a Trello board JSON export, or attach this
            app directly inside Trello as a Power-Up.
          </p>

          {/* Tabs */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#eef4ef] p-1">
            {[
              { id: 'api', label: 'Trello API', icon: KeyRound },
              { id: 'json', label: 'Trello JSON', icon: FileJson },
              { id: 'powerup', label: 'Trello Power-Up', icon: Puzzle },
            ].map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setError('')
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer sm:text-sm ${
                    active
                      ? 'bg-[#1f6336] text-white shadow-xs'
                      : 'text-zinc-700 hover:bg-white/60'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* TAB 1: TRELLO API */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">
                    Trello API Key
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste your 32-char API key"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#1f6336] focus:ring-2 focus:ring-[#1f6336]/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">
                    Trello Read Token
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste your Trello token"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#1f6336] focus:ring-2 focus:ring-[#1f6336]/15"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberCreds}
                    onChange={(e) => setRememberCreds(e.target.checked)}
                    className="h-4 w-4 accent-[#1f6336]"
                  />
                  <span>Remember credentials in this browser</span>
                </label>

                <div className="flex items-center gap-3">
                  <a
                    href="https://trello.com/power-ups/admin"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-[#1f6336] hover:underline"
                  >
                    <span>Get API Key</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {authorizeTokenUrl && (
                    <a
                      href={authorizeTokenUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[#1f6336] hover:underline"
                    >
                      <span>Generate Token</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={loadingBoards}
                  onClick={() => handleFetchBoards()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1f6336] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#174d2a] disabled:opacity-50 cursor-pointer"
                >
                  {loadingBoards && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{boards.length > 0 ? 'Refresh Boards' : 'Fetch My Trello Boards'}</span>
                </button>
                {(apiKey || token || boards.length > 0) && (
                  <button
                    type="button"
                    onClick={handleClearCredentials}
                    className="rounded-lg border border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {boards.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
                  <div className="bg-[#e6f0e7] px-4 py-2.5 text-xs font-semibold text-zinc-900">
                    Select a Trello Board ({boards.length})
                  </div>
                  <div className="max-h-60 divide-y divide-zinc-100 overflow-y-auto">
                    {boards.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        disabled={Boolean(loadingBoardId)}
                        onClick={() => handleSelectBoard(b.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-zinc-50 disabled:opacity-60 cursor-pointer"
                      >
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{b.name}</p>
                          {b.desc && (
                            <p className="line-clamp-1 text-xs text-zinc-500">{b.desc}</p>
                          )}
                        </div>
                        {loadingBoardId === b.id ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#1f6336]" />
                        ) : (
                          <span className="rounded-md bg-[#e6f0e7] px-2.5 py-1 text-xs font-semibold text-[#1f6336]">
                            Load Board
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD TRELLO JSON */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  const file = e.dataTransfer.files?.[0]
                  handleJsonFile(file)
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
                  isDragging
                    ? 'border-[#1f6336] bg-[#eef6ee]'
                    : 'border-zinc-300 bg-zinc-50/70 hover:border-[#1f6336]/60 hover:bg-[#f6faf6]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => handleJsonFile(e.target.files?.[0])}
                  className="hidden"
                />
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e3f1e5] text-[#1f6336]">
                  <Upload className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-zinc-900">
                  Drop your Trello Board JSON file here, or click to browse
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  In Trello: Open Board Menu → Print, export, and share → Export as JSON
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: TRELLO POWER-UP */}
          {activeTab === 'powerup' && (
            <div className="space-y-4 text-sm text-zinc-700">
              <p>
                When opened inside Trello as a Power-Up, <strong>Board Export</strong> reads
                your live board directly through the Trello Power-Up SDK without needing API
                keys.
              </p>

              <div className="rounded-xl border border-zinc-200 bg-[#f6faf6] p-4">
                <p className="text-xs font-semibold text-zinc-900">Iframe Connector URL</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800">
                    {connectorUrl}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1f6336] px-3 py-2 text-xs font-semibold text-white hover:bg-[#174d2a] cursor-pointer"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <ol className="list-decimal space-y-2 pl-5 text-xs leading-relaxed text-zinc-700">
                <li>
                  Deploy this folder to Vercel and open{' '}
                  <a
                    href="https://trello.com/power-ups/admin"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#1f6336] hover:underline"
                  >
                    trello.com/power-ups/admin
                  </a>
                  .
                </li>
                <li>
                  Create a new Power-Up and set the <strong>Iframe connector URL</strong> to your
                  Vercel deployment URL.
                </li>
                <li>
                  Under <strong>Capabilities</strong>, enable <strong>board-buttons</strong>.
                </li>
                <li>
                  Enable the Power-Up on your Trello board and click <strong>Board Export</strong>{' '}
                  in the board header.
                </li>
              </ol>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
