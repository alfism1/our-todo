import toast from 'react-hot-toast'

export function projectUrl(projectId) {
  return `${window.location.origin}/project/${projectId}`
}

/**
 * navigator.clipboard needs a secure context, which rules out plain-http LAN
 * testing on a phone — fall back to the old execCommand trick there.
 */
export async function copyShareLink(projectId) {
  const url = projectUrl(projectId)
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    } else {
      const el = document.createElement('textarea')
      el.value = url
      el.setAttribute('readonly', '')
      el.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    toast.success('Share link copied')
    return true
  } catch {
    toast.error('Copy failed — link: ' + url)
    return false
  }
}

/** Uses the native share sheet on mobile when available, else copies. */
export async function shareProject(projectId, projectName) {
  const url = projectUrl(projectId)
  if (navigator.share) {
    try {
      await navigator.share({ title: projectName, url })
      return true
    } catch (err) {
      if (err?.name === 'AbortError') return false
      // Fall through to clipboard if the share sheet is unavailable.
    }
  }
  return copyShareLink(projectId)
}
