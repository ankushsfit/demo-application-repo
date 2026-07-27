export function validateTaskText(value, tasks) {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Task cannot be empty.'
  }

  if (trimmed.length > 80) {
    return 'Task must be 80 characters or less.'
  }

  const duplicate = tasks.some((task) => task.text.toLowerCase() === trimmed.toLowerCase())
  if (duplicate) {
    return 'This task already exists.'
  }

  return { text: trimmed }
}

export function normalizePriority(value) {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value
  }

  return 'medium'
}

export function normalizeDueDate(value) {
  if (!value) {
    return ''
  }

  const match = /^\d{4}-\d{2}-\d{2}$/.exec(value)
  if (!match) {
    return ''
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function formatDueDate(value) {
  if (!value) {
    return ''
  }

  const match = /^\d{4}-\d{2}-\d{2}$/.exec(value)
  if (!match) {
    return ''
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const monthName = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: 'UTC',
  }).format(date)

  return `${monthName} ${day}`
}
