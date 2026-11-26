import { ArrowLeftRight, CheckSquare, Download, LayoutGrid, Star } from 'lucide-react'

export default function TrelloBoardShell({
  board,
  sourceLabel,
  isModalOpen,
  onOpenModal,
  onDisconnect,
  children,
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#0b4f6c] via-[#0d627a] to-[#147a74] text-white">
      {/* Top Bar */}
      <header className="flex h-12 items-center justify-between border-b border-white/15 bg-black/25 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <LayoutGrid className="h-4 w-4 text-sky-200" />
            <span className="text-base">Trello</span>
          </div>
          {sourceLabel && (
            <span className="hidden rounded bg-white/10 px-2 py-0.5 text-xs text-white/85 sm:inline-block">
              Source: {sourceLabel}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onDisconnect}
          className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/25 cursor-pointer"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          <span>Switch Board</span>
        </button>
      </header>

      {/* Board Sub-header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-black/15 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-white">{board.name}</h1>
          <Star className="h-4 w-4 text-amber-300" />
          <span className="rounded bg-white/15 px-2 py-0.5 text-xs text-white/90">
            {board.cards.length} cards
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="inline-flex items-center gap-2 rounded-md bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1f6336] shadow-xs transition hover:bg-emerald-50 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Board Export</span>
        </button>
      </div>

      {/* Real Kanban Lists */}
      <div className="flex gap-4 overflow-x-auto p-4">
        {board.lists.map((list) => {
          const listCards = board.cards.filter((c) => c.listId === list.id && !c.closed)
          return (
            <div
              key={list.id}
              className="w-72 shrink-0 rounded-xl bg-[#f1f2f4] p-2.5 text-zinc-800 shadow-md"
            >
              <div className="mb-2 flex items-center justify-between px-1.5 py-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: list.color }}
                  />
                  <h2 className="text-sm font-semibold text-zinc-900">{list.name}</h2>
                </div>
                <span className="text-xs font-medium text-zinc-500">{listCards.length}</span>
              </div>

              <div className="space-y-2">
                {listCards.slice(0, 6).map((card) => (
                  <div
                    key={card.id}
                    className="rounded-lg border border-zinc-200/80 bg-white p-2.5 shadow-2xs"
                  >
                    {card.labels.length > 0 && (
                      <div className="mb-1.5 flex flex-wrap gap-1">
                        {card.labels.map((lbl) => (
                          <span
                            key={lbl.id}
                            style={{ backgroundColor: lbl.bg, color: lbl.text }}
                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                          >
                            {lbl.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[13px] font-medium text-zinc-900">{card.name}</p>
                    {(card.checklistTotal > 0 || card.members.length > 0) && (
                      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                        {card.checklistTotal > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" />
                            {card.checklistDone}/{card.checklistTotal}
                          </span>
                        ) : (
                          <span />
                        )}
                        <div className="flex items-center gap-1">
                          {card.members.map((m) => (
                            <span
                              key={m.id}
                              title={m.fullName}
                              style={{ backgroundColor: m.bg, color: m.text }}
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold"
                            >
                              {m.initials}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {listCards.length > 6 && (
                  <p className="px-1.5 pt-0.5 text-xs text-zinc-500">
                    +{listCards.length - 6} more cards
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-zinc-950/55 p-4 backdrop-blur-[2px]">
          {children}
        </div>
      )}
    </div>
  )
}
