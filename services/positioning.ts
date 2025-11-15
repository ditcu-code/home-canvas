export interface Point {
  x: number
  y: number
}

export const computeRelativePositionFromPoint = (
  img: HTMLImageElement,
  containerEl: HTMLElement,
  clientX: number,
  clientY: number,
): { position: Point; relative: { xPercent: number; yPercent: number } } | null => {
  const containerRect = containerEl.getBoundingClientRect()
  const { naturalWidth, naturalHeight } = img
  const containerWidth = containerRect.width
  const containerHeight = containerRect.height

  if (!naturalWidth || !naturalHeight || !containerWidth || !containerHeight) return null

  const imageAspectRatio = naturalWidth / naturalHeight
  const containerAspectRatio = containerWidth / containerHeight

  let renderedWidth: number
  let renderedHeight: number
  if (imageAspectRatio > containerAspectRatio) {
    renderedWidth = containerWidth
    renderedHeight = containerWidth / imageAspectRatio
  } else {
    renderedHeight = containerHeight
    renderedWidth = containerHeight * imageAspectRatio
  }

  const offsetX = (containerWidth - renderedWidth) / 2
  const offsetY = (containerHeight - renderedHeight) / 2

  const dropX = clientX - containerRect.left
  const dropY = clientY - containerRect.top

  const imageX = dropX - offsetX
  const imageY = dropY - offsetY

  if (imageX < 0 || imageX > renderedWidth || imageY < 0 || imageY > renderedHeight) {
    return null
  }

  const xPercent = (imageX / renderedWidth) * 100
  const yPercent = (imageY / renderedHeight) * 100

  return {
    position: { x: dropX, y: dropY },
    relative: { xPercent, yPercent },
  }
}
