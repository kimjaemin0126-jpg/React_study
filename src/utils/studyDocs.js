// 스터디 문서를 서버에 보낼 모양으로 바꾸고, 하위 문서 묶음을 찾는 도우미

// 대상 문서와 그 하위 문서들의 id 모음
export function collectDescendantIds(documents, rootId) {
  const ids = new Set([rootId])
  let changed = true
  while (changed) {
    changed = false
    documents.forEach((document) => {
      if (document.parentId && ids.has(document.parentId) && !ids.has(document.id)) {
        ids.add(document.id)
        changed = true
      }
    })
  }
  return ids
}

// 이 스터디에 속한 문서 전체를 서버 형식으로 변환 (삭제되었거나 나간 문서는 제외)
export function toStudyDocs(documents, workspaceId) {
  const members = documents.filter((document) => document.workspaceId === workspaceId && !document.isDeleted && !document.studyLeft)
  const ids = new Set(members.map((document) => document.id))
  return members.map((document) => ({
    id: document.id,
    parentId: ids.has(document.parentId) ? document.parentId : null,
    title: document.title ?? '',
    blocks: document.blocks,
    events: document.events ?? [],
    isTask: Boolean(document.isTask),
    taskStatus: document.taskStatus ?? 'todo',
    startDate: document.startDate ?? null,
    endDate: document.endDate ?? null,
    status: document.status ?? null,
  }))
}
