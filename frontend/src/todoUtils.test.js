import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDueDate, normalizeDueDate, normalizePriority, validateTaskText } from './todoUtils.js'

test('rejects empty task text', () => {
  assert.equal(validateTaskText('   ', []), 'Task cannot be empty.')
})

test('rejects duplicate tasks case-insensitively', () => {
  assert.equal(validateTaskText('Buy milk', [{ text: 'buy milk' }]), 'This task already exists.')
})

test('accepts a trimmed task within the allowed length', () => {
  const result = validateTaskText('  Plan the weekend  ', [])
  assert.deepEqual(result, { text: 'Plan the weekend' })
})

test('rejects tasks that are too long', () => {
  const longText = 'x'.repeat(81)
  assert.equal(validateTaskText(longText, []), 'Task must be 80 characters or less.')
})

test('normalizes priorities to a supported set', () => {
  assert.equal(normalizePriority('HIGH'), 'medium')
  assert.equal(normalizePriority('low'), 'low')
})

test('normalizes and formats due dates', () => {
  assert.equal(normalizeDueDate('2026-08-07'), '2026-08-07')
  assert.equal(normalizeDueDate('not-a-date'), '')
  assert.equal(formatDueDate('2026-08-07'), 'Aug 7')
})
