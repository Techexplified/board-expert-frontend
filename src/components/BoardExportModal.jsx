import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckSquare,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Layers,
  LayoutList,
  Lightbulb,
  Loader2,
  Pencil,
  RotateCw,
  Settings,
  Star,
  X,
} from 'lucide-react'
import StepperBar from './StepperBar'
import {
  BottomWaves,
  CompletedIllustration,
  ExportingIllustration,
  FailedIllustration,
  WelcomeIllustration,
} from './ExportIllustrations'
import {
  countSelectedFields,
  formatDisplayDate,
  generateExportFiles,
  getFilteredCards,
  triggerFileDownloads,
} from '../utils/exporter'

function GreenCheckbox({ checked, indeterminate = false, onChange, label }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-[5px] border transition ${
          checked || indeterminate
            ? 'border-[#1f6336] bg-[#1f6336] text-white'
            : 'border-zinc-300 bg-white hover:border-[#1f6336]/60'
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
        {!checked && indeterminate && <span className="h-0.5 w-2.5 rounded-full bg-white" />}
      </span>
    </label>
  )
}

function InfoTooltip({ text }) {
  return (
    <span className="group relative inline-flex items-center">
      <Info className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-[#1f6336]" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  )
}

const DEFAULT_FIELDS = {
  cardName: true,
  description: true,
  attachments: false,
  labels: true,
  members: true,
  list: true,
  startDate: true,
  dueDate: true,
  completedDate: false,
  checklist: true,
  comments: true,
}

function defaultExportFileName(boardName) {
  const cleaned = (boardName || 'Trello_Board')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return cleaned ? `${cleaned}_Export` : 'Trello_Board_Export'
}

export default function BoardExportModal({
  board,
  onClose,
  isTrelloModal = false,
}) {
  const [screen, setScreen] = useState('welcome')
  const [selectedListIds, setSelectedListIds] = useState(() => board.lists.map((l) => l.id))
  const [selectedFields, setSelectedFields] = useState(DEFAULT_FIELDS)
  const [includeCustomFields, setIncludeCustomFields] = useState(
    () => (board.customFields?.length || 0) > 0
  )
  const [format, setFormat] = useState('csv')
  const [fileName, setFileName] = useState(() => defaultExportFileName(board.name))
  const [includeArchived, setIncludeArchived] = useState(true)
  const [includeCover, setIncludeCover] = useState(false)
  const [splitByList, setSplitByList] = useState(false)

  const [exportStage, setExportStage] = useState(0)
  const [exportPercent, setExportPercent] = useState(0)
  const [generatedFiles, setGeneratedFiles] = useState([])
  const [errorMessage, setErrorMessage] = useState('')

  const timersRef = useRef([])

  useEffect(() => {
    setSelectedListIds(board.lists.map((l) => l.id))
    setIncludeCustomFields((board.customFields?.length || 0) > 0)
    setFileName(defaultExportFileName(board.name))
  }, [board])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id))
    }
  }, [])

  const listMap = useMemo(
    () => Object.fromEntries(board.lists.map((l) => [l.id, l])),
    [board.lists]
  )

  const cardCountsByList = useMemo(() => {
    const counts = {}
    for (const list of board.lists) counts[list.id] = 0
    for (const card of board.cards) {
      if (includeArchived || !card.closed) {
        counts[card.listId] = (counts[card.listId] || 0) + 1
      }
    }
    return counts
  }, [board.lists, board.cards, includeArchived])

  const filteredCards = useMemo(
    () => getFilteredCards(board, selectedListIds, includeArchived),
    [board, selectedListIds, includeArchived]
  )

  const totalFieldsCount = useMemo(
    () =>
      countSelectedFields({
        selectedFields,
        includeCustomFields,
        customFieldCount: board.customFields?.length || 0,
        includeCover,
        includeArchived,
      }),
    [selectedFields, includeCustomFields, board.customFields, includeCover, includeArchived]
  )

  const allListsSelected =
    board.lists.length > 0 && selectedListIds.length === board.lists.length
  const someListsSelected =
    selectedListIds.length > 0 && selectedListIds.length < board.lists.length

  const toggleAllLists = () => {
    if (allListsSelected) {
      setSelectedListIds([])
    } else {
      setSelectedListIds(board.lists.map((l) => l.id))
    }
  }

  const toggleList = (listId) => {
    setSelectedListIds((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]
    )
  }

  const toggleField = (key) => {
    setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const clearTimers = () => {
    timersRef.current.forEach((id) => clearTimeout(id))
    timersRef.current = []
  }

  const startExport = () => {
    clearTimers()
    setScreen('exporting')
    setExportStage(0)
    setExportPercent(0)
    setGeneratedFiles([])

    const schedule = (fn, delay) => {
      const id = setTimeout(fn, delay)
      timersRef.current.push(id)
    }

    schedule(() => {
      setExportStage(1)
    }, 300)

    schedule(() => {
      setExportStage(2)
      setExportPercent(30)
    }, 600)

    schedule(() => {
      setExportPercent(65)
    }, 900)

    schedule(() => {
      try {
        const files = generateExportFiles({
          board,
          selectedListIds,
          selectedFields,
          includeCustomFields,
          format,
          fileName,
          includeArchived,
          includeCover,
          splitByList,
        })
        setGeneratedFiles(files)
        setExportPercent(100)
        setExportStage(3)
        schedule(() => {
          setScreen('completed')
        }, 350)
      } catch (err) {
        setErrorMessage(err?.message || 'An unexpected error occurred while generating the file.')
        setScreen('failed')
      }
    }, 1200)
  }

  const previewCards = filteredCards.slice(0, 5)
  const displayExtension = format === 'xlsx' ? 'xlsx' : 'csv'
  const displayFileName = `${(fileName || 'Trello_Board_Export').trim()}.${displayExtension}`

  return (
    <div
      className={`relative flex flex-col bg-white text-zinc-900 ${
        isTrelloModal
          ? 'min-h-screen w-full'
          : 'w-full max-w-[660px] rounded-2xl border border-zinc-200/90 shadow-2xl'
      }`}
    >
      {/* Modal Header (Trello modal already renders its own outer titlebar) */}
      {!isTrelloModal && (
        <header className="flex items-center justify-between border-b border-zinc-200/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md text-[#1f6336]">
              <Download className="h-5 w-5 stroke-[2.2]" />
            </span>
            <h2 className="text-[19px] font-bold tracking-tight text-zinc-900">
              Board Export
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Board Export"
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
      )}

      {/* Stepper Bar (shown on steps 1–4) */}
      {typeof screen === 'number' && (
        <StepperBar currentStep={screen} onStepClick={(step) => setScreen(step)} />
      )}

      {/* Main Content */}
      <div className="relative flex-1 px-6 pt-4 pb-6">
        {/* WELCOME SCREEN */}
        {screen === 'welcome' && (
          <div className="relative flex flex-col items-center pt-2 pb-10 text-center">
            <WelcomeIllustration />

            <h1 className="mt-3 text-[26px] font-bold tracking-tight text-[#0e2d1a]">
              Export Your Trello Board
            </h1>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-zinc-600">
              Download <strong className="font-semibold text-zinc-800">{board.name}</strong> into a
              spreadsheet (CSV or Excel) with the fields you need.
            </p>

            <ul className="mt-6 space-y-3 text-left">
              {[
                'Export all or selected lists',
                'Choose the card fields to include',
                'Include custom fields, checklists & more',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[15px] text-zinc-800">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e3f1e5] text-[#1f6336]">
                    <Check className="h-3.5 w-3.5 stroke-[2.8]" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setScreen(1)}
              className="mt-7 inline-flex items-center gap-2.5 rounded-lg bg-[#1f6336] px-8 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#174d2a] active:scale-[0.99] cursor-pointer"
            >
              <span>Start Export</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP 1: SELECT LISTS */}
        {screen === 1 && (
          <div className="flex flex-col">
            <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">
              Select Lists
            </h1>
            <p className="mt-0.5 text-sm text-zinc-600">
              Choose which lists to include in your export.
            </p>

            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="flex items-center gap-3 bg-[#e6f0e7] px-4 py-3">
                <GreenCheckbox
                  checked={allListsSelected}
                  indeterminate={someListsSelected}
                  onChange={toggleAllLists}
                  label="Select all lists"
                />
                <span className="text-[15px] font-semibold text-zinc-900">
                  All Lists ({board.lists.length})
                </span>
              </div>

              <div className="max-h-72 divide-y divide-zinc-100 overflow-y-auto">
                {board.lists.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-zinc-500">
                    This board has no open lists.
                  </p>
                ) : (
                  board.lists.map((list) => {
                    const isChecked = selectedListIds.includes(list.id)
                    return (
                      <label
                        key={list.id}
                        className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-zinc-50"
                      >
                        <GreenCheckbox
                          checked={isChecked}
                          onChange={() => toggleList(list.id)}
                          label={`Include ${list.name}`}
                        />
                        <span
                          className="h-4 w-5 shrink-0 rounded-[4px]"
                          style={{ backgroundColor: list.color }}
                        />
                        <span className="text-[15px] font-medium text-zinc-800">
                          {list.name}{' '}
                          <span className="font-normal text-zinc-500">
                            ({cardCountsByList[list.id] ?? 0})
                          </span>
                        </span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            {selectedListIds.length === 0 && (
              <p className="mt-2.5 text-xs font-medium text-red-600">
                Select at least one list to continue.
              </p>
            )}

            <div className="mt-7 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-300 bg-white px-7 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedListIds.length === 0}
                onClick={() => setScreen(2)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1f6336] px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-[#174d2a] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CHOOSE FIELDS */}
        {screen === 2 && (
          <div className="flex flex-col">
            <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">
              Choose Fields
            </h1>
            <p className="mt-0.5 text-sm text-zinc-600">
              Select the card details to include in your export.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div className="flex items-center gap-2 bg-[#e6f0e7] px-3.5 py-2.5 text-sm font-semibold text-zinc-900">
                  <FileText className="h-4 w-4 text-[#1f6336]" />
                  <span>Card Details</span>
                </div>
                <div className="divide-y divide-zinc-100">
                  {[
                    { key: 'cardName', label: 'Card Name (Title)' },
                    { key: 'description', label: 'Description' },
                    { key: 'attachments', label: 'Attachments (Link)' },
                    { key: 'labels', label: 'Labels' },
                    { key: 'members', label: 'Members' },
                    { key: 'list', label: 'List' },
                  ].map((field) => (
                    <label
                      key={field.key}
                      className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm text-zinc-800 transition hover:bg-zinc-50"
                    >
                      <GreenCheckbox
                        checked={selectedFields[field.key]}
                        onChange={() => toggleField(field.key)}
                        label={field.label}
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <div className="flex items-center gap-2 bg-[#e6f0e7] px-3.5 py-2.5 text-sm font-semibold text-zinc-900">
                    <Calendar className="h-4 w-4 text-[#1f6336]" />
                    <span>Dates</span>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {[
                      { key: 'startDate', label: 'Start Date' },
                      { key: 'dueDate', label: 'Due Date' },
                      { key: 'completedDate', label: 'Completed Date' },
                    ].map((field) => (
                      <label
                        key={field.key}
                        className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm text-zinc-800 transition hover:bg-zinc-50"
                      >
                        <GreenCheckbox
                          checked={selectedFields[field.key]}
                          onChange={() => toggleField(field.key)}
                          label={field.label}
                        />
                        <span>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <div className="flex items-center gap-2 bg-[#e6f0e7] px-3.5 py-2.5 text-sm font-semibold text-zinc-900">
                    <CheckSquare className="h-4 w-4 text-[#1f6336]" />
                    <span>More Details</span>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {[
                      { key: 'checklist', label: 'Checklist (Items & Status)' },
                      { key: 'comments', label: 'Comments' },
                    ].map((field) => (
                      <label
                        key={field.key}
                        className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm text-zinc-800 transition hover:bg-zinc-50"
                      >
                        <GreenCheckbox
                          checked={selectedFields[field.key]}
                          onChange={() => toggleField(field.key)}
                          label={field.label}
                        />
                        <span>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#faf4e8] px-4 py-3">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-[#c78f24]" />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Custom Fields ({board.customFields?.length || 0})
                  </p>
                  <p className="text-xs text-zinc-600">
                    {(board.customFields?.length || 0) > 0
                      ? "Include data from your board's custom fields."
                      : 'No custom fields found on this board.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={includeCustomFields}
                aria-label="Toggle custom fields"
                disabled={(board.customFields?.length || 0) === 0}
                onClick={() => setIncludeCustomFields((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  includeCustomFields ? 'bg-[#1f6336]' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow-xs transition-transform ${
                    includeCustomFields ? 'translate-x-5.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {totalFieldsCount === 0 && (
              <p className="mt-2 text-xs font-medium text-red-600">
                Select at least one field to export.
              </p>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setScreen(1)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={totalFieldsCount === 0}
                onClick={() => setScreen(3)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1f6336] px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-[#174d2a] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: EXPORT OPTIONS */}
        {screen === 3 && (
          <div className="flex flex-col">
            <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">
              Export Options
            </h1>
            <p className="mt-0.5 text-sm text-zinc-600">
              Fine-tune your export settings.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <div className="flex items-center gap-2 bg-[#e6f0e7] px-3.5 py-2.5 text-sm font-semibold text-zinc-900">
                    <FileSpreadsheet className="h-4 w-4 text-[#1f6336]" />
                    <span>Export Format</span>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    <label className="flex cursor-pointer items-center justify-between px-3.5 py-3 text-sm text-zinc-800 hover:bg-zinc-50">
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="export-format"
                          checked={format === 'csv'}
                          onChange={() => setFormat('csv')}
                          className="h-4 w-4 accent-[#1f6336]"
                        />
                        <span className="font-medium">CSV (.csv)</span>
                      </span>
                      <span className="rounded-full bg-[#dff0e1] px-2.5 py-0.5 text-xs font-medium text-[#1f6336]">
                        Recommended
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 px-3.5 py-3 text-sm text-zinc-800 hover:bg-zinc-50">
                      <input
                        type="radio"
                        name="export-format"
                        checked={format === 'xlsx'}
                        onChange={() => setFormat('xlsx')}
                        className="h-4 w-4 accent-[#1f6336]"
                      />
                      <span className="font-medium">Excel (.xlsx)</span>
                    </label>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <div className="flex items-center gap-2 bg-[#e6f0e7] px-3.5 py-2.5 text-sm font-semibold text-zinc-900">
                    <Pencil className="h-4 w-4 text-[#1f6336]" />
                    <span>File Name</span>
                  </div>
                  <div className="p-3.5">
                    <div className="flex overflow-hidden rounded-lg border border-zinc-300 focus-within:border-[#1f6336] focus-within:ring-2 focus-within:ring-[#1f6336]/15">
                      <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Trello_Board_Export"
                        className="min-w-0 flex-1 px-3 py-2 text-sm text-zinc-900 outline-none"
                      />
                      <span className="flex items-center border-l border-zinc-200 bg-zinc-100 px-3 text-sm font-medium text-zinc-600">
                        .{displayExtension}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="self-start overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div className="flex items-center gap-2 bg-[#e6f0e7] px-3.5 py-2.5 text-sm font-semibold text-zinc-900">
                  <Layers className="h-4 w-4 text-[#1f6336]" />
                  <span>Include in Export</span>
                </div>
                <div className="divide-y divide-zinc-100">
                  <label className="flex cursor-pointer items-center justify-between gap-2 px-3.5 py-3 text-sm text-zinc-800 hover:bg-zinc-50">
                    <span className="flex items-center gap-3">
                      <GreenCheckbox
                        checked={includeArchived}
                        onChange={() => setIncludeArchived((v) => !v)}
                        label="Include archived cards"
                      />
                      <span>Include archived cards</span>
                    </span>
                    <InfoTooltip text="Export closed/archived cards from the selected lists alongside active cards." />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-2 px-3.5 py-3 text-sm text-zinc-800 hover:bg-zinc-50">
                    <span className="flex items-start gap-3">
                      <span className="mt-0.5">
                        <GreenCheckbox
                          checked={includeCover}
                          onChange={() => setIncludeCover((v) => !v)}
                          label="Add a card cover column"
                        />
                      </span>
                      <span className="leading-snug">
                        Add a card cover column (with image links)
                      </span>
                    </span>
                    <InfoTooltip text="Adds a Card Cover column containing image attachment URLs when available." />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-2 px-3.5 py-3 text-sm text-zinc-800 hover:bg-zinc-50">
                    <span className="flex items-start gap-3">
                      <span className="mt-0.5">
                        <GreenCheckbox
                          checked={splitByList}
                          onChange={() => setSplitByList((v) => !v)}
                          label="Split data by list"
                        />
                      </span>
                      <span className="leading-snug">
                        Split data by list (separate sheet per list)
                      </span>
                    </span>
                    <InfoTooltip text="Creates one worksheet per list in Excel (.xlsx), or separate CSV files per list." />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setScreen(2)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setScreen(4)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1f6336] px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-[#174d2a] cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PREVIEW */}
        {screen === 4 && (
          <div className="flex flex-col">
            <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">
              Preview Export
            </h1>
            <p className="mt-0.5 text-sm text-zinc-600">
              Review a sample of your export (first 5 cards).
            </p>

            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
              <table className="w-full min-w-[540px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="bg-[#e6f0e7] text-zinc-900">
                    {selectedFields.cardName && (
                      <th className="whitespace-nowrap px-3.5 py-2.5 font-semibold">Card Name</th>
                    )}
                    {selectedFields.list && (
                      <th className="whitespace-nowrap px-3 py-2.5 font-semibold">List</th>
                    )}
                    {selectedFields.description && (
                      <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Description</th>
                    )}
                    {selectedFields.members && (
                      <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Members</th>
                    )}
                    {selectedFields.startDate && (
                      <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Start Date</th>
                    )}
                    {selectedFields.dueDate && (
                      <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Due Date</th>
                    )}
                    {selectedFields.completedDate && (
                      <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Completed</th>
                    )}
                    {selectedFields.labels && (
                      <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Labels</th>
                    )}
                    {selectedFields.checklist && (
                      <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Checklist</th>
                    )}
                    {selectedFields.comments && (
                      <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Comments</th>
                    )}
                    {selectedFields.attachments && (
                      <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Attachments</th>
                    )}
                    {includeCover && (
                      <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Card Cover</th>
                    )}
                    {includeArchived && (
                      <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Status</th>
                    )}
                    {includeCustomFields &&
                      (board.customFields || []).map((cf) => (
                        <th key={cf.id} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                          {cf.name}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {previewCards.length === 0 ? (
                    <tr>
                      <td
                        colSpan={Math.max(1, totalFieldsCount)}
                        className="px-4 py-8 text-center text-sm text-zinc-500"
                      >
                        No cards match your current list/filter selection.
                      </td>
                    </tr>
                  ) : (
                    previewCards.map((card) => {
                      const pct =
                        card.checklistTotal > 0
                          ? Math.round((card.checklistDone / card.checklistTotal) * 100)
                          : 0
                      return (
                        <tr key={card.id} className="hover:bg-zinc-50/70">
                          {selectedFields.cardName && (
                            <td className="whitespace-nowrap px-3.5 py-2.5 font-medium text-zinc-900">
                              {card.name}
                            </td>
                          )}
                          {selectedFields.list && (
                            <td className="whitespace-nowrap px-3 py-2.5 text-zinc-700">
                              {listMap[card.listId]?.name || '—'}
                            </td>
                          )}
                          {selectedFields.description && (
                            <td className="max-w-[200px] truncate px-3 py-2.5 text-zinc-600" title={card.desc}>
                              {card.desc || '—'}
                            </td>
                          )}
                          {selectedFields.members && (
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1">
                                {card.members.length === 0 ? (
                                  <span className="text-zinc-400">—</span>
                                ) : (
                                  card.members.slice(0, 3).map((m) => (
                                    <span
                                      key={m.id}
                                      title={m.fullName}
                                      style={{ backgroundColor: m.bg, color: m.text }}
                                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold"
                                    >
                                      {m.initials}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                          )}
                          {selectedFields.startDate && (
                            <td className="whitespace-nowrap px-3 py-2.5 text-zinc-700">
                              {formatDisplayDate(card.startDate)}
                            </td>
                          )}
                          {selectedFields.dueDate && (
                            <td className="whitespace-nowrap px-3 py-2.5 text-zinc-700">
                              {formatDisplayDate(card.dueDate)}
                            </td>
                          )}
                          {selectedFields.completedDate && (
                            <td className="whitespace-nowrap px-3 py-2.5 text-zinc-700">
                              {formatDisplayDate(card.completedDate)}
                            </td>
                          )}
                          {selectedFields.labels && (
                            <td className="px-3 py-2.5">
                              <div className="flex flex-wrap gap-1">
                                {card.labels.length === 0 ? (
                                  <span className="text-zinc-400">—</span>
                                ) : (
                                  card.labels.slice(0, 2).map((lbl) => (
                                    <span
                                      key={lbl.id}
                                      style={{ backgroundColor: lbl.bg, color: lbl.text }}
                                      className="inline-block rounded-md px-2 py-0.5 text-[11px] font-medium"
                                    >
                                      {lbl.name}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                          )}
                          {selectedFields.checklist && (
                            <td className="px-3 py-2.5">
                              {card.checklistTotal === 0 ? (
                                <span className="text-zinc-400">—</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="w-7 text-xs text-zinc-700">
                                    {card.checklistDone}/{card.checklistTotal}
                                  </span>
                                  <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-200">
                                    <div
                                      className="h-full rounded-full bg-[#4ca138] transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </td>
                          )}
                          {selectedFields.comments && (
                            <td className="whitespace-nowrap px-3 py-2.5 text-zinc-700">
                              {card.commentsCount > 0
                                ? `${card.commentsCount} ${card.commentsCount === 1 ? 'comment' : 'comments'}`
                                : '—'}
                            </td>
                          )}
                          {selectedFields.attachments && (
                            <td className="whitespace-nowrap px-3 py-2.5 text-zinc-700">
                              {card.attachments.length > 0
                                ? `${card.attachments.length} ${card.attachments.length === 1 ? 'link' : 'links'}`
                                : '—'}
                            </td>
                          )}
                          {includeCover && (
                            <td className="max-w-[160px] truncate px-3 py-2.5 text-zinc-700" title={card.coverUrl}>
                              {card.coverUrl || '—'}
                            </td>
                          )}
                          {includeArchived && (
                            <td className="whitespace-nowrap px-3 py-2.5">
                              <span
                                className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${
                                  card.closed
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {card.closed ? 'Archived' : 'Active'}
                              </span>
                            </td>
                          )}
                          {includeCustomFields &&
                            (board.customFields || []).map((cf) => (
                              <td key={cf.id} className="whitespace-nowrap px-3 py-2.5 text-zinc-700">
                                {card.customFields?.[cf.name] || '—'}
                              </td>
                            ))}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#faf4e8] px-4 py-3 text-xs text-zinc-700">
              <div className="flex items-center gap-2 font-medium text-zinc-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#c78f24] text-[11px] font-bold text-[#c78f24]">
                  i
                </span>
                <span>
                  <strong>Total: {filteredCards.length} cards</strong> will be exported
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-zinc-700">
                <span className="inline-flex items-center gap-1.5">
                  <LayoutList className="h-3.5 w-3.5 text-zinc-500" />
                  {selectedListIds.length} lists
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-zinc-500" />
                  {totalFieldsCount} fields
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-zinc-500" />
                  {format === 'xlsx' ? 'Excel format' : 'CSV format'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setScreen(3)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={filteredCards.length === 0}
                onClick={startExport}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1f6336] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#174d2a] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Export Now</span>
              </button>
            </div>
          </div>
        )}

        {/* EXPORTING PROGRESS */}
        {screen === 'exporting' && (
          <div className="relative flex flex-col items-center pt-2 pb-10">
            <ExportingIllustration />

            <h1 className="mt-3 text-[25px] font-bold tracking-tight text-[#0e2d1a]">
              Exporting Your Board...
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Please wait while we prepare your file.
            </p>

            <div className="relative mt-6 w-full max-w-[520px] space-y-2.5">
              {[
                {
                  title: 'Fetching board data',
                  doneText: `${filteredCards.length} cards found`,
                },
                {
                  title: 'Processing selected fields',
                  doneText: `${totalFieldsCount} fields`,
                },
                {
                  title: 'Generating export file',
                  isProgress: true,
                },
                {
                  title: 'Finalizing & preparing download',
                },
              ].map((step, idx) => {
                const isDone = exportStage > idx
                const isActive = exportStage === idx
                return (
                  <div
                    key={step.title}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm transition-colors ${
                      isDone
                        ? 'bg-[#eef6ee] text-zinc-900'
                        : isActive
                          ? 'bg-[#f9f4eb] text-zinc-900'
                          : 'bg-transparent text-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isDone ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#246936] text-white">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      ) : isActive ? (
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#246936]" />
                      ) : (
                        <span className="h-5 w-5 shrink-0 rounded-full border-2 border-zinc-300 bg-white" />
                      )}
                      <span className={isDone || isActive ? 'font-semibold' : 'font-medium'}>
                        {step.title}
                      </span>
                    </div>

                    {isDone && step.doneText && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700">
                        <Check className="h-3.5 w-3.5 text-[#246936]" />
                        {step.doneText}
                      </span>
                    )}

                    {step.isProgress && (isActive || isDone) && (
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-40 overflow-hidden rounded-full bg-zinc-200">
                          <div
                            className="h-full rounded-full bg-[#4ca138] transition-all duration-300"
                            style={{ width: `${isDone ? 100 : exportPercent}%` }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs font-medium text-zinc-700">
                          {isDone ? 100 : exportPercent}%
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* EXPORT COMPLETED */}
        {screen === 'completed' && (
          <div className="relative flex flex-col items-center pt-2 pb-10 text-center">
            <CompletedIllustration format={format} />

            <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#0e2d1a]">
              Export Completed!
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Your board data is ready to download.
            </p>

            <div className="mt-5 grid w-full max-w-[540px] grid-cols-2 divide-y divide-zinc-200 rounded-xl bg-[#f4f8f4] px-2 py-3 text-left sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              <div className="flex items-center gap-2.5 px-3 py-1">
                <FileText className="h-5 w-5 shrink-0 text-[#1f6336]" />
                <div>
                  <p className="text-sm font-bold text-zinc-900">{filteredCards.length}</p>
                  <p className="text-xs text-zinc-600">Cards</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-1">
                <LayoutList className="h-5 w-5 shrink-0 text-[#1f6336]" />
                <div>
                  <p className="text-sm font-bold text-zinc-900">{selectedListIds.length}</p>
                  <p className="text-xs text-zinc-600">Lists</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-1">
                <Layers className="h-5 w-5 shrink-0 text-[#1f6336]" />
                <div>
                  <p className="text-sm font-bold text-zinc-900">{totalFieldsCount}</p>
                  <p className="text-xs text-zinc-600">Fields</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-1">
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#1f6336]" />
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    {format === 'xlsx' ? 'XLSX' : 'CSV'}
                  </p>
                  <p className="text-xs text-zinc-600">Format</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerFileDownloads(generatedFiles)}
              className="mt-6 inline-flex items-center gap-2.5 rounded-lg bg-[#1f6336] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#174d2a] active:scale-[0.99] cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>
                Download File{' '}
                <span className="font-normal opacity-90">
                  ({generatedFiles.length > 1 ? `${generatedFiles.length} CSV files` : displayFileName})
                </span>
              </span>
            </button>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setScreen(1)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Export Again</span>
              </button>
              <button
                type="button"
                onClick={() => setScreen(3)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Change Settings</span>
              </button>
            </div>
          </div>
        )}

        {/* EXPORT FAILED */}
        {screen === 'failed' && (
          <div className="relative flex flex-col items-center pt-2 pb-10">
            <FailedIllustration format={format} />

            <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#0e2d1a]">
              Export Failed
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              We couldn&apos;t export your board right now.
            </p>

            <div className="mt-5 w-full max-w-[530px] space-y-3">
              <div className="flex items-start gap-3 rounded-xl bg-[#fdf0ee] px-4 py-3 text-left">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#a5331d]" />
                <div>
                  <p className="text-sm font-semibold text-[#8c2513]">What went wrong?</p>
                  <p className="mt-0.5 text-xs text-zinc-700">{errorMessage}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-[#eef5ec] px-4 py-3.5 text-left">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#868e28]" />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">What you can do:</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-zinc-700">
                    <li>Try exporting fewer lists or fields.</li>
                    <li>Or, split the export by list (separate file per list).</li>
                    <li>If the issue persists, try again in a few minutes.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={startExport}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 cursor-pointer"
              >
                <RotateCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={() => setScreen(3)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1f6336] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#174d2a] cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                <span>Change Export Settings</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {(screen === 'welcome' ||
        screen === 'exporting' ||
        screen === 'completed' ||
        screen === 'failed') && <BottomWaves />}
    </div>
  )
}
