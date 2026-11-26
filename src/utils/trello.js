const LIST_COLORS = ['#a855f7', '#fbbf24', '#60a5fa', '#65d030', '#fb7185', '#2dd4bf']

export const TRELLO_APP_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TRELLO_API_KEY) ||
  'd6bc9446e0a893fc7cab3fe117c75aa5'

export const TRELLO_APP_NAME = 'Board Export'

const TRELLO_LABEL_STYLES = {
  green: { bg: '#dcfce7', text: '#15803d' },
  green_light: { bg: '#dcfce7', text: '#15803d' },
  green_dark: { bg: '#bbf7d0', text: '#166534' },
  yellow: { bg: '#fef3c7', text: '#b45309' },
  yellow_light: { bg: '#fef9c3', text: '#a16207' },
  yellow_dark: { bg: '#fde68a', text: '#92400e' },
  orange: { bg: '#ffedd5', text: '#c2410c' },
  orange_light: { bg: '#ffedd5', text: '#c2410c' },
  red: { bg: '#fee2e2', text: '#b91c1c' },
  red_light: { bg: '#fee2e2', text: '#b91c1c' },
  purple: { bg: '#f3e8ff', text: '#7e22ce' },
  purple_light: { bg: '#f3e8ff', text: '#7e22ce' },
  blue: { bg: '#dbeafe', text: '#1d4ed8' },
  blue_light: { bg: '#dbeafe', text: '#1d4ed8' },
  sky: { bg: '#cffafe', text: '#0e7490' },
  sky_light: { bg: '#cffafe', text: '#0e7490' },
  lime: { bg: '#ecfccb', text: '#4d7c0f' },
  lime_light: { bg: '#ecfccb', text: '#4d7c0f' },
  pink: { bg: '#fce7f3', text: '#be185d' },
  pink_light: { bg: '#fce7f3', text: '#be185d' },
  black: { bg: '#e4e4e7', text: '#27272a' },
}

const AVATAR_STYLES = [
  { bg: '#ede9fe', text: '#6d28d9' },
  { bg: '#dcfce7', text: '#15803d' },
  { bg: '#fef3c7', text: '#b45309' },
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#fce7f3', text: '#be185d' },
]

function getInitials(member) {
  if (member?.initials) return String(member.initials).slice(0, 2).toUpperCase()
  const source = member?.fullName || member?.username || 'TM'
  const parts = source.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

function resolveCustomFieldValue(item, fieldDef) {
  if (!item) return ''
  if (item.value) {
    if (item.value.text !== undefined) return String(item.value.text)
    if (item.value.number !== undefined) return String(item.value.number)
    if (item.value.date !== undefined) return String(item.value.date).slice(0, 10)
    if (item.value.checked !== undefined) return item.value.checked === 'true' ? 'Yes' : 'No'
  }
  if (item.idValue && Array.isArray(fieldDef?.options)) {
    const opt = fieldDef.options.find((o) => o.id === item.idValue)
    return opt?.value?.text || ''
  }
  return ''
}

export function normalizeTrelloBoard(rawBoard, overrideLists, overrideCards) {
  const rawLists = overrideLists ?? rawBoard?.lists ?? []
  const rawCards = overrideCards ?? rawBoard?.cards ?? []
  const rawMembers = rawBoard?.members ?? []
  const rawLabels = rawBoard?.labels ?? []
  const rawChecklists = rawBoard?.checklists ?? []
  const rawActions = rawBoard?.actions ?? []

  const memberById = Object.fromEntries(rawMembers.map((m) => [m.id, m]))
  const labelById = Object.fromEntries(rawLabels.map((l) => [l.id, l]))

  const checklistsByCardId = {}
  for (const cl of rawChecklists) {
    if (!cl?.idCard) continue
    if (!checklistsByCardId[cl.idCard]) checklistsByCardId[cl.idCard] = []
    checklistsByCardId[cl.idCard].push(cl)
  }

  const commentsByCardId = {}
  for (const action of rawActions) {
    if (action?.type !== 'commentCard') continue
    const cardId = action?.data?.card?.id
    if (!cardId) continue
    if (!commentsByCardId[cardId]) commentsByCardId[cardId] = []
    commentsByCardId[cardId].push({
      author: action.memberCreator?.fullName || action.memberCreator?.username || 'Member',
      text: action.data?.text || '',
      date: action.date ? action.date.slice(0, 10) : '',
    })
  }

  const customFields = (rawBoard?.customFields || []).map((cf) => ({
    id: cf.id,
    name: cf.name || 'Custom Field',
    options: cf.options || [],
  }))
  const cfById = Object.fromEntries(customFields.map((cf) => [cf.id, cf]))

  const activeRawLists = rawLists.filter((l) => !l.closed)
  const lists = activeRawLists.map((list, idx) => ({
    id: list.id,
    name: list.name || 'Untitled List',
    color: LIST_COLORS[idx % LIST_COLORS.length],
  }))

  const activeListIds = new Set(lists.map((l) => l.id))

  const cards = rawCards
    .filter((card) => activeListIds.has(card.idList))
    .map((card) => {
      const cardRawMembers =
        card.members && card.members.length > 0
          ? card.members
          : (card.idMembers || []).map((id) => memberById[id]).filter(Boolean)

      const members = cardRawMembers.map((m, idx) => {
        const style = AVATAR_STYLES[idx % AVATAR_STYLES.length]
        return {
          id: m.id,
          initials: getInitials(m),
          fullName: m.fullName || m.username || 'Member',
          bg: style.bg,
          text: style.text,
        }
      })

      const cardRawLabels =
        card.labels && card.labels.length > 0
          ? card.labels
          : (card.idLabels || []).map((id) => labelById[id]).filter(Boolean)

      const labels = cardRawLabels.map((lbl) => {
        const style = TRELLO_LABEL_STYLES[lbl.color] || { bg: '#e4e4e7', text: '#27272a' }
        return {
          id: lbl.id || `${lbl.color}-${lbl.name}`,
          name: lbl.name || lbl.color || 'Label',
          bg: style.bg,
          text: style.text,
        }
      })

      const cardChecklists =
        card.checklists && card.checklists.length > 0
          ? card.checklists
          : checklistsByCardId[card.id] || []

      const checklistItems = cardChecklists.flatMap((cl) =>
        (cl.checkItems || []).map((item) => ({
          checklistName: cl.name,
          name: item.name,
          state: item.state === 'complete' ? 'complete' : 'incomplete',
        }))
      )

      const checklistTotal =
        checklistItems.length > 0 ? checklistItems.length : card.badges?.checkItems || 0
      const checklistDone =
        checklistItems.length > 0
          ? checklistItems.filter((i) => i.state === 'complete').length
          : card.badges?.checkItemsChecked || 0

      const comments = commentsByCardId[card.id] || []
      const commentsCount =
        comments.length > 0 ? comments.length : card.badges?.comments || 0

      const customFieldValues = {}
      for (const item of card.customFieldItems || []) {
        const def = cfById[item.idCustomField]
        if (def) {
          customFieldValues[def.name] = resolveCustomFieldValue(item, def)
        }
      }

      const attachments = (card.attachments || []).map((a) => a.url).filter(Boolean)
      const coverAttachment = card.idAttachmentCover
        ? (card.attachments || []).find((a) => a.id === card.idAttachmentCover)
        : null
      const coverUrl =
        card.cover?.scaled?.[card.cover.scaled.length - 1]?.url ||
        card.cover?.url ||
        coverAttachment?.url ||
        ''

      return {
        id: card.id,
        name: card.name || 'Untitled Card',
        listId: card.idList,
        desc: card.desc || '',
        members,
        labels,
        startDate: card.start ? card.start.slice(0, 10) : '',
        dueDate: card.due ? card.due.slice(0, 10) : '',
        completedDate: card.dueComplete && card.due ? card.due.slice(0, 10) : '',
        checklistDone,
        checklistTotal,
        checklistItems,
        comments,
        commentsCount,
        attachments,
        coverUrl,
        closed: Boolean(card.closed),
        customFields: customFieldValues,
      }
    })

  return {
    id: rawBoard?.id || 'trello-board',
    name: rawBoard?.name || 'Trello Board',
    lists,
    cards,
    customFields,
  }
}

export function isTrelloConnectorContext() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('view') === 'export') return false
  const inIframe = window.self !== window.top
  if (!inIframe || !window.TrelloPowerUp) return false

  const fromTrello = /trello\.com/i.test(document.referrer || '')
  const ancestorIsTrello =
    typeof window.location.ancestorOrigins !== 'undefined' &&
    Array.from(window.location.ancestorOrigins).some((origin) =>
      /trello\.com/i.test(origin)
    )
  const hasTrelloLocale = params.has('locale')

  return fromTrello || ancestorIsTrello || hasTrelloLocale
}

export function isTrelloModalContext() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('view') === 'export' && Boolean(window.TrelloPowerUp)
}

export function buildTrelloAuthorizeUrl(apiKey = TRELLO_APP_KEY) {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://board-expert-frontend.vercel.app'
  const params = new URLSearchParams({
    expiration: '30days',
    name: TRELLO_APP_NAME,
    scope: 'read',
    response_type: 'token',
    key: apiKey.trim(),
    return_url: `${origin}/callback`,
  })
  return `https://trello.com/1/authorize?${params.toString()}`
}

export function extractTrelloCallbackHash() {
  if (typeof window === 'undefined' || !window.location.hash) return null
  const rawHash = window.location.hash.replace(/^#/, '')
  const params = new URLSearchParams(rawHash)
  const token = params.get('token')
  const error = params.get('error')
  if (!token && !error) return null
  return { token, error }
}

export function initTrelloPowerUp() {
  if (typeof window === 'undefined' || !window.TrelloPowerUp) return
  const iconUrl = `${window.location.origin}/board-export-icon.svg`

  window.TrelloPowerUp.initialize(
    {
      'board-buttons': () => [
        {
          icon: {
            dark: iconUrl,
            light: iconUrl,
          },
          text: 'Board Export',
          condition: 'always',
          callback: (t) =>
            t.modal({
              url: './?view=export',
              accentColor: '#1f6336',
              height: 660,
              title: 'Board Export',
            }),
        },
      ],
    },
    {
      appKey: TRELLO_APP_KEY,
      appName: TRELLO_APP_NAME,
    }
  )
}

export async function loadTrelloBoardFromPowerUp() {
  if (!isTrelloModalContext()) {
    throw new Error('Not running inside a Trello Power-Up modal.')
  }

  const t = window.TrelloPowerUp.iframe({
    appKey: TRELLO_APP_KEY,
    appName: TRELLO_APP_NAME,
  })

  try {
    const restApi = t.getRestApi?.()
    if (restApi && (await restApi.isAuthorized())) {
      const [restToken, rawBoardMeta] = await Promise.all([
        restApi.getToken(),
        t.board('id'),
      ])
      if (restToken && rawBoardMeta?.id) {
        const fullBoard = await fetchFullTrelloBoard(
          rawBoardMeta.id,
          TRELLO_APP_KEY,
          restToken
        )
        return { board: fullBoard, t }
      }
    }
  } catch {
    // Fall back to Power-Up iframe context API when REST token isn't authorized
  }

  const [rawBoard, rawLists, rawCards] = await Promise.all([
    t.board('all'),
    t.lists('all'),
    t.cards('all'),
  ])

  return {
    board: normalizeTrelloBoard(rawBoard, rawLists, rawCards),
    t,
  }
}

export async function fetchUserTrelloBoards(apiKey, token) {
  const key = apiKey.trim()
  const tok = token.trim()
  if (!key || !tok) {
    throw new Error('Please provide both a Trello API key and token.')
  }

  const url = `https://api.trello.com/1/members/me/boards?filter=open&fields=id,name,desc,url,prefs&key=${encodeURIComponent(
    key
  )}&token=${encodeURIComponent(tok)}`

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      res.status === 401
        ? 'Invalid Trello API key or token. Please reconnect with Trello.'
        : `Trello API error (${res.status}): ${text || res.statusText}`
    )
  }

  return res.json()
}

export async function fetchFullTrelloBoard(boardId, apiKey, token) {
  const key = apiKey.trim()
  const tok = token.trim()
  const params = new URLSearchParams({
    lists: 'all',
    cards: 'all',
    card_fields: 'all',
    card_attachments: 'true',
    card_checklists: 'all',
    card_customFieldItems: 'true',
    customFields: 'true',
    members: 'all',
    labels: 'all',
    actions: 'commentCard',
    actions_limit: '1000',
    key,
    token: tok,
  })

  const res = await fetch(`https://api.trello.com/1/boards/${encodeURIComponent(boardId)}?${params}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to fetch board (${res.status}): ${text || res.statusText}`)
  }

  const rawBoard = await res.json()
  return normalizeTrelloBoard(rawBoard)
}

export function parseTrelloBoardJson(jsonText) {
  let parsed
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('Invalid JSON file. Please upload a valid Trello board JSON export.')
  }

  if (!parsed || !Array.isArray(parsed.lists) || !Array.isArray(parsed.cards)) {
    throw new Error(
      'This JSON does not look like a Trello board export (missing "lists" or "cards").'
    )
  }

  return normalizeTrelloBoard(parsed)
}
