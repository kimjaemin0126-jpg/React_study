import { useEffect } from 'react'
import { studyApi } from '../services/studyApi'

// 내가 들어가 있는 스터디의 권한과 닫힘 상태를 10초마다 확인해서 목록에 바로 반영 (새로고침 없이)
export function useStudyWatch({ documents, updateWorkspaceDocuments, applyStudyRole, hideStudyForMembers }) {
  const workspaceIds = [...new Set(
    documents
      .filter((item) => item.workspaceId && !item.studyLeft && !item.isDeleted)
      .map((item) => item.workspaceId)
  )]
  const key = workspaceIds.join(',')

  useEffect(() => {
    if (!key) return
    let ignore = false

    function check() {
      if (window.document.visibilityState !== 'visible') return
      key.split(',').forEach((workspaceId) => {
        studyApi.getStudy(workspaceId)
          .then((study) => {
            if (!ignore) applyStudyRole(workspaceId, study.me.role)
          })
          .catch((err) => {
            if (ignore) return
            // 강퇴되었거나 참여 정보가 없으면 목록에서 숨김
            if (err.status === 401 || err.status === 403) updateWorkspaceDocuments(workspaceId, { studyLeft: true })
            // 방장이 스터디를 닫았으면 방장이 아닌 사람의 목록에서 숨김
            else if (err.status === 410) hideStudyForMembers(workspaceId)
          })
      })
    }

    const timer = window.setInterval(check, 10000)
    return () => {
      ignore = true
      window.clearInterval(timer)
    }
  }, [key, updateWorkspaceDocuments, applyStudyRole, hideStudyForMembers])
}
