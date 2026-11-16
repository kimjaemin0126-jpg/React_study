import { randomUUID } from 'node:crypto'

// 메모리 저장소: 서버가 재시작되면 모든 데이터가 사라짐 (의도된 동작)
// 자바스크립트는 한 번에 한 작업만 실행하므로, 각 함수 호출 안에서 읽기와 쓰기가 끊기지 않음
const tables = {
  workspace: new Map(),
  member: new Map(),
  invite: new Map(),
}

const DEFAULTS = {
  workspace: () => ({ content: [], closedAt: null, createdAt: new Date(), updatedAt: new Date() }),
  member: () => ({ role: 'VIEWER', removedAt: null, createdAt: new Date() }),
  invite: () => ({ role: 'VIEWER', maxUses: null, useCount: 0, revokedAt: null, createdAt: new Date() }),
}

const clone = (value) => structuredClone(value)

// where 조건: 값이 같은지만 비교 (null도 그대로 비교)
function matches(row, where = {}) {
  return Object.entries(where).every(([key, value]) => row[key] === value)
}

// select: 필요한 필드만 골라서 반환 (codeHash 같은 값을 숨길 때 사용)
function project(row, select) {
  if (!select) return clone(row)
  return Object.fromEntries(Object.keys(select).filter((key) => select[key]).map((key) => [key, row[key]]))
}

function findRows(table, where) {
  return [...table.values()].filter((row) => matches(row, where))
}

function createModel(name) {
  const table = tables[name]

  const model = {
    create({ data, include }) {
      const { members, ...fields } = data
      const row = { id: randomUUID(), ...DEFAULTS[name](), ...fields }
      table.set(row.id, row)

      // 중첩 생성: 스터디 생성 때 방장 멤버를 함께 만듦
      if (members?.create) {
        store.member.create({ data: { ...members.create, workspaceId: row.id } })
      }

      const result = clone(row)
      if (include?.members) result.members = findRows(tables.member, { workspaceId: row.id }).map(clone)
      return result
    },

    findUnique({ where, select }) {
      const row = findRows(table, where)[0]
      return row ? project(row, select) : null
    },

    findMany({ where, select, orderBy }) {
      let rows = findRows(table, where)
      if (orderBy) {
        const [[key, direction]] = Object.entries(orderBy)
        rows = rows.sort((a, b) => (a[key] - b[key]) * (direction === 'desc' ? -1 : 1))
      }
      return rows.map((row) => project(row, select))
    },

    count({ where }) {
      return findRows(table, where).length
    },

    update({ where, data }) {
      const row = findRows(table, where)[0]
      if (!row) throw new Error(`${name} 데이터를 찾을 수 없습니다.`)
      applyChanges(row, data)
      return clone(row)
    },

    updateMany({ where, data }) {
      const rows = findRows(table, where)
      rows.forEach((row) => applyChanges(row, data))
      return { count: rows.length }
    },
  }

  return model
}

// 변경 값 적용: { field: value } 또는 { field: { increment: n } }
function applyChanges(row, data) {
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && 'increment' in value) {
      row[key] += value.increment
    } else {
      row[key] = value
    }
  }
  if ('content' in data || 'name' in data || 'closedAt' in data) row.updatedAt = new Date()
}

export const store = {
  workspace: createModel('workspace'),
  member: createModel('member'),
  invite: createModel('invite'),

  // 트랜잭션: 함수 형태는 같은 저장소를 넘기고, 배열 형태는 순서대로 실행
  async $transaction(arg) {
    if (typeof arg === 'function') return arg(store)
    return Promise.all(arg)
  },
}
