import * as XLSX from 'xlsx'

export function formatDisplayDate(isoDate) {
  if (!isoDate) return '—'
  const parsed = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getFilteredCards(board, selectedListIds, includeArchived) {
  const listSet = new Set(selectedListIds)
  return board.cards.filter(
    (card) => listSet.has(card.listId) && (includeArchived || !card.closed)
  )
}

export function countSelectedFields({
  selectedFields,
  includeCustomFields,
  customFieldCount,
  includeCover = false,
  includeArchived = false,
}) {
  const baseCount = Object.values(selectedFields).filter(Boolean).length
  return (
    baseCount +
    (includeCustomFields ? customFieldCount : 0) +
    (includeCover ? 1 : 0) +
    (includeArchived ? 1 : 0)
  )
}

function escapeCsvCell(value) {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function normalizeTextCell(value) {
  if (!value) return ''
  return String(value).replace(/\r?\n+/g, ' ').trim()
}

function formatChecklistCell(card) {
  if (card.checklistTotal === 0 && (!card.checklistItems || card.checklistItems.length === 0)) {
    return ''
  }
  const summary = `${card.checklistDone}/${card.checklistTotal}`
  if (!card.checklistItems || card.checklistItems.length === 0) {
    return summary
  }
  const itemsText = card.checklistItems
    .map((item) => `${item.state === 'complete' ? '✓' : '○'} ${item.name}`)
    .join(', ')
  return `${summary} (${itemsText})`
}

function formatCommentsCell(card) {
  if (card.comments && card.comments.length > 0) {
    return card.comments
      .map((c) => `${c.author}${c.date ? ` (${c.date})` : ''}: ${normalizeTextCell(c.text)}`)
      .join(' | ')
  }
  if (card.commentsCount > 0) {
    return `${card.commentsCount} ${card.commentsCount === 1 ? 'comment' : 'comments'}`
  }
  return ''
}

function buildRowObject(
  card,
  listMap,
  { selectedFields, includeCustomFields, customFields, includeCover, includeArchived }
) {
  const row = {}

  if (selectedFields.cardName) {
    row['Card Name'] = card.name
  }
  if (selectedFields.list) {
    row['List'] = listMap[card.listId]?.name || 'Unknown'
  }
  if (selectedFields.description) {
    row['Description'] = normalizeTextCell(card.desc)
  }
  if (selectedFields.labels) {
    row['Labels'] = card.labels.map((l) => l.name).join(', ')
  }
  if (selectedFields.members) {
    row['Members'] = card.members.map((m) => m.fullName || m.initials).join(', ')
  }
  if (selectedFields.startDate) {
    row['Start Date'] = card.startDate ? formatDisplayDate(card.startDate) : ''
  }
  if (selectedFields.dueDate) {
    row['Due Date'] = card.dueDate ? formatDisplayDate(card.dueDate) : ''
  }
  if (selectedFields.completedDate) {
    row['Completed Date'] = card.completedDate ? formatDisplayDate(card.completedDate) : ''
  }
  if (selectedFields.checklist) {
    row['Checklist'] = formatChecklistCell(card)
  }
  if (selectedFields.comments) {
    row['Comments'] = formatCommentsCell(card)
  }
  if (selectedFields.attachments) {
    row['Attachments'] = card.attachments.join(' | ')
  }
  if (includeCover) {
    row['Card Cover'] = card.coverUrl || ''
  }
  if (includeArchived) {
    row['Status'] = card.closed ? 'Archived' : 'Active'
  }
  if (includeCustomFields) {
    for (const cf of customFields) {
      row[cf.name] = card.customFields?.[cf.name] ?? ''
    }
  }

  return row
}

function rowsToCsv(rows) {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(',')),
  ]
  return `\uFEFF${lines.join('\r\n')}`
}

function sanitizeSheetName(name, usedNames) {
  const cleaned = (name || 'Sheet').replace(/[\\/*?:[\]]/g, '').trim() || 'Sheet'
  let candidate = cleaned.slice(0, 31)
  let suffix = 1
  while (usedNames.has(candidate)) {
    const tag = `_${suffix++}`
    candidate = `${cleaned.slice(0, 31 - tag.length)}${tag}`
  }
  usedNames.add(candidate)
  return candidate
}

function autoFitSheet(rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  if (rows.length > 0) {
    const headers = Object.keys(rows[0])
    worksheet['!cols'] = headers.map((header) => {
      const maxLen = Math.max(
        header.length,
        ...rows.map((r) => {
          const val = String(r[header] ?? '')
          return Math.max(...val.split(/\r?\n/).map((line) => line.length))
        })
      )
      return { wch: Math.min(Math.max(maxLen + 4, 14), 45) }
    })
    if (worksheet['!ref']) {
      worksheet['!autofilter'] = { ref: worksheet['!ref'] }
    }
  }
  return worksheet
}

export function generateExportFiles({
  board,
  selectedListIds,
  selectedFields,
  includeCustomFields,
  format,
  fileName,
  includeArchived,
  includeCover,
  splitByList,
}) {
  const safeBaseName = (fileName || 'Trello_Board_Export').trim().replace(/[\\/:*?"<>|]/g, '_')
  const listMap = Object.fromEntries(board.lists.map((l) => [l.id, l]))
  const cards = getFilteredCards(board, selectedListIds, includeArchived)

  const rowOpts = {
    selectedFields,
    includeCustomFields,
    customFields: board.customFields || [],
    includeCover,
    includeArchived,
  }

  if (format === 'xlsx') {
    const workbook = XLSX.utils.book_new()
    if (splitByList) {
      const usedNames = new Set()
      for (const listId of selectedListIds) {
        const list = listMap[listId]
        if (!list) continue
        const listCards = cards.filter((c) => c.listId === listId)
        const rows = listCards.map((card) => buildRowObject(card, listMap, rowOpts))
        const ws =
          rows.length > 0
            ? autoFitSheet(rows)
            : XLSX.utils.json_to_sheet([{ Info: 'No cards in this list' }])
        XLSX.utils.book_append_sheet(workbook, ws, sanitizeSheetName(list.name, usedNames))
      }
    } else {
      const rows = cards.map((card) => buildRowObject(card, listMap, rowOpts))
      const ws =
        rows.length > 0
          ? autoFitSheet(rows)
          : XLSX.utils.json_to_sheet([{ Info: 'No cards selected' }])
      XLSX.utils.book_append_sheet(workbook, ws, 'Board Export')
    }

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    return [{ filename: `${safeBaseName}.xlsx`, blob }]
  }

  if (splitByList) {
    const files = []
    for (const listId of selectedListIds) {
      const list = listMap[listId]
      if (!list) continue
      const listCards = cards.filter((c) => c.listId === listId)
      const rows = listCards.map((card) => buildRowObject(card, listMap, rowOpts))
      const csv = rowsToCsv(rows)
      const listSlug = list.name.replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '')
      files.push({
        filename: `${safeBaseName}_${listSlug}.csv`,
        blob: new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      })
    }
    return files
  }

  const rows = cards.map((card) => buildRowObject(card, listMap, rowOpts))
  const csv = rowsToCsv(rows)
  return [
    {
      filename: `${safeBaseName}.csv`,
      blob: new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    },
  ]
}

export function triggerFileDownloads(files) {
  files.forEach((file, idx) => {
    setTimeout(() => {
      const url = URL.createObjectURL(file.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, idx * 180)
  })
}
