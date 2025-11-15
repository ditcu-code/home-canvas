import DebugModal from "@/components/DebugModal"
import ErrorState from "@/components/ErrorState"
import Header from "@/components/Header"
import ProgressBar from "@/components/ProgressBar"
import ProgressSteps from "@/components/ProgressSteps"
import UploadView from "@/components/UploadView"
import WorkspaceView from "@/components/WorkspaceView"
import { loadingMessages } from "@/constants/loadingMessages"
import { useObjectUrlCleanup } from "@/hooks/useObjectUrlCleanup"
import { useRotatingMessages } from "@/hooks/useRotatingMessages"
import { useSimulatedProgress } from "@/hooks/useSimulatedProgress"
import { dataURLtoFile } from "@/services/fileUtils"
import { generateCompositeImage } from "@/services/geminiService"
import { Product } from "@/types"
import React, { useCallback, useEffect, useRef, useState } from "react"
// Drag-and-drop and touch DnD removed; click-to-place only
// Utilities and constants moved to dedicated modules

const App: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [sceneImage, setSceneImage] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [persistedOrbPosition, setPersistedOrbPosition] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null)
  const [debugPrompt, setDebugPrompt] = useState<string | null>(null)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [generatedSceneUrlForDownload, setGeneratedSceneUrlForDownload] = useState<string | null>(
    null,
  )
  // Preserve the originally uploaded scene for re-generations (e.g., resizing)
  const [originalSceneImage, setOriginalSceneImage] = useState<File | null>(null)
  // Allow post-generation size adjustments
  const [jewelryScale, setJewelryScale] = useState<number>(1)
  const [lastDropRelativePosition, setLastDropRelativePosition] = useState<{
    xPercent: number
    yPercent: number
  } | null>(null)

  const sceneImgRef = useRef<HTMLImageElement>(null)
  // Refs to support opening file pickers from "Change" buttons
  const productFileInputRef = useRef<HTMLInputElement>(null)
  const sceneUploaderOpenRef = useRef<(() => void) | null>(null)

  const sceneImageUrl = sceneImage ? URL.createObjectURL(sceneImage) : null
  const productImageUrl = selectedProduct ? selectedProduct.imageUrl : null

  // Hooks: URL cleanup + rotating loading messages
  useObjectUrlCleanup(sceneImageUrl)
  useObjectUrlCleanup(productImageUrl)
  const loadingMessageIndex = useRotatingMessages(isLoading, loadingMessages, 3000)
  const progress = useSimulatedProgress(isLoading)

  // Progress steps guidance
  const steps = ["Upload Jewelry", "Upload Scene", "Place Jewelry", "Generate", "Review & Download"]
  const currentStep = (() => {
    if (!productImageFile) return 0 // Upload Jewelry
    if (!sceneImage) return 1 // Upload Scene
    if (isLoading) return 3 // Generating
    if (generatedSceneUrlForDownload && !isLoading) return 4 // Review & Download
    if (persistedOrbPosition) return 3 // Ready to Generate
    return 2 // Place Jewelry
  })()

  // Centralized generation-state reset to avoid repetition
  const resetGenerationState = useCallback(() => {
    setPersistedOrbPosition(null)
    setDebugImageUrl(null)
    setDebugPrompt(null)
    setGeneratedSceneUrlForDownload(null)
    setJewelryScale(1)
    setLastDropRelativePosition(null)
  }, [])

  const handleProductImageUpload = useCallback(
    (file: File) => {
      // useEffect will handle cleaning up the previous blob URL
      setError(null)
      try {
        const imageUrl = URL.createObjectURL(file)
        const product: Product = {
          id: Date.now(),
          name: file.name,
          imageUrl: imageUrl,
        }
        setProductImageFile(file)
        setSelectedProduct(product)
        // Clear generation-related state when changing jewelry
        resetGenerationState()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
        setError(`Could not load the jewelry image. Details: ${errorMessage}`)
        console.error(err)
      }
    },
    [resetGenerationState],
  )

  const handleSceneImageUpload = useCallback(
    (file: File) => {
      setSceneImage(file)
      setOriginalSceneImage(file)
      // Clear generation-related state when changing scene
      resetGenerationState()
    },
    [resetGenerationState],
  )

  // Hidden input change handlers (for Change buttons)
  const handleProductFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleProductImageUpload(file)
    // Allow selecting the same file again later
    e.currentTarget.value = ""
  }

  // Instant Start feature removed

  const handleProductDrop = useCallback(
    async (
      position: { x: number; y: number },
      relativePosition: { xPercent: number; yPercent: number },
    ) => {
      if (!productImageFile || !sceneImage || !selectedProduct) {
        setError("An unexpected error occurred. Please try again.")
        return
      }
      // Only record the desired placement; generation happens on explicit user action.
      setPersistedOrbPosition(position)
      setLastDropRelativePosition(relativePosition)
      setError(null)
    },
    [productImageFile, sceneImage, selectedProduct],
  )

  const handleGenerate = useCallback(async () => {
    if (!productImageFile || !sceneImage || !selectedProduct || !lastDropRelativePosition) {
      setError("Please select a location in the scene first.")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const baseScene = originalSceneImage || sceneImage
      const { finalImageUrl, debugImageUrl, finalPrompt } = await generateCompositeImage(
        productImageFile,
        selectedProduct.name,
        baseScene,
        baseScene.name,
        lastDropRelativePosition,
        jewelryScale,
      )
      setGeneratedSceneUrlForDownload(finalImageUrl)
      setDebugImageUrl(debugImageUrl)
      setDebugPrompt(finalPrompt)
      const newSceneFile = dataURLtoFile(finalImageUrl, `generated-scene-${Date.now()}.jpeg`)
      setSceneImage(newSceneFile)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError(`Failed to generate the image. ${errorMessage}`)
      console.error(err)
    } finally {
      setIsLoading(false)
      // Clear placement orb after generation
      setPersistedOrbPosition(null)
    }
  }, [
    productImageFile,
    sceneImage,
    selectedProduct,
    originalSceneImage,
    jewelryScale,
    lastDropRelativePosition,
  ])

  const handleReset = useCallback(() => {
    // Let useEffect handle URL revocation
    setSelectedProduct(null)
    setProductImageFile(null)
    setSceneImage(null)
    setError(null)
    setIsLoading(false)
    resetGenerationState()
    setOriginalSceneImage(null)
  }, [resetGenerationState])

  const handleChangeProduct = useCallback(() => {
    // Let useEffect handle URL revocation
    setSelectedProduct(null)
    setProductImageFile(null)
    resetGenerationState()
  }, [resetGenerationState])

  const handleChangeScene = useCallback(() => {
    setSceneImage(null)
    setOriginalSceneImage(null)
    resetGenerationState()
  }, [resetGenerationState])

  const handleAdjustScale = useCallback(
    async (delta: number) => {
      if (!productImageFile || !originalSceneImage || !selectedProduct || !lastDropRelativePosition)
        return
      const nextScale = Math.max(0.5, Math.min(2, jewelryScale + delta))
      if (nextScale === jewelryScale) return
      setIsLoading(true)
      setError(null)
      try {
        const { finalImageUrl, debugImageUrl, finalPrompt } = await generateCompositeImage(
          productImageFile,
          selectedProduct.name,
          originalSceneImage,
          originalSceneImage.name,
          lastDropRelativePosition,
          nextScale,
        )
        setGeneratedSceneUrlForDownload(finalImageUrl)
        setDebugImageUrl(debugImageUrl)
        setDebugPrompt(finalPrompt)
        const newSceneFile = dataURLtoFile(finalImageUrl, `generated-scene-${Date.now()}.jpeg`)
        setSceneImage(newSceneFile)
        setJewelryScale(nextScale)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
        setError(`Failed to adjust size. ${errorMessage}`)
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    },
    [productImageFile, originalSceneImage, selectedProduct, lastDropRelativePosition, jewelryScale],
  )

  // Effects above are handled by hooks now

  // Touch DnD removed; tap (click) on scene places the item

  // Handle paste (Cmd+V) of images from the clipboard.
  // If both uploaders are empty, prioritize filling the jewelry first.
  useEffect(() => {
    const isTypingInEditable = (el: Element | null): boolean => {
      if (!el) return false
      const tag = (el as HTMLElement).tagName?.toLowerCase()
      const editable = (el as HTMLElement).isContentEditable
      return (
        editable ||
        tag === "input" ||
        tag === "textarea" ||
        (tag === "div" && (el as HTMLElement).getAttribute("role") === "textbox")
      )
    }

    const onPaste = (e: ClipboardEvent) => {
      // Avoid interfering with typing/pasting into inputs
      const active = document.activeElement
      if (isTypingInEditable(active)) return

      const cd = e.clipboardData
      if (!cd) return

      let pastedFile: File | null = null

      // Prefer items API for better type filtering
      if (cd.items && cd.items.length > 0) {
        for (const item of Array.from(cd.items)) {
          if (item.kind === "file" && item.type.startsWith("image/")) {
            const f = item.getAsFile()
            if (f) {
              pastedFile = f
              break
            }
          }
        }
      }

      // Fallback to files list
      if (!pastedFile && cd.files && cd.files.length > 0) {
        const candidate = cd.files[0]
        if (candidate && candidate.type.startsWith("image/")) {
          pastedFile = candidate
        }
      }

      if (!pastedFile) return

      // Decide where to place the pasted image
      const jewelryEmpty = !productImageFile
      const sceneEmpty = !sceneImage

      if (jewelryEmpty && sceneEmpty) {
        handleProductImageUpload(pastedFile)
        return
      }

      if (jewelryEmpty) {
        handleProductImageUpload(pastedFile)
        return
      }

      if (sceneEmpty) {
        handleSceneImageUpload(pastedFile)
        return
      }
      // If both are already set, do nothing to avoid accidental replacement
    }

    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [productImageFile, sceneImage, handleProductImageUpload, handleSceneImageUpload])

  const renderContent = () => {
    if (error) {
      return <ErrorState message={error} onReset={handleReset} />
    }

    if (!productImageFile || !sceneImage) {
      return (
        <UploadView
          productImageUrl={productImageUrl}
          sceneImageUrl={sceneImageUrl}
          onUploadProduct={handleProductImageUpload}
          onUploadScene={handleSceneImageUpload}
          onChangeProduct={() => productFileInputRef.current?.click()}
          onChangeScene={() => sceneUploaderOpenRef.current?.()}
          canChangeProduct={!!productImageFile}
          canChangeScene={!!sceneImage}
          openSceneDialogRef={sceneUploaderOpenRef}
        />
      )
    }

    return (
      <div className="w-full max-w-7xl mx-auto animate-fade-in">
        <WorkspaceView
          selectedProduct={selectedProduct!}
          onChangeProduct={() => productFileInputRef.current?.click()}
          sceneImgRef={sceneImgRef}
          sceneImageUrl={sceneImageUrl!}
          isLoading={isLoading}
          onSceneFileSelect={handleSceneImageUpload}
          onProductDrop={handleProductDrop}
          persistedOrbPosition={persistedOrbPosition}
          showGenerateButton={!!persistedOrbPosition && !isLoading}
          onGenerateClick={handleGenerate}
          showRetryButton={
            !!(
              generatedSceneUrlForDownload &&
              lastDropRelativePosition &&
              !isLoading &&
              !persistedOrbPosition
            )
          }
          onRetryClick={handleGenerate}
          showDebugButton={!!debugImageUrl && !isLoading && !persistedOrbPosition}
          onDebugClick={() => setIsDebugModalOpen(true)}
          showDownloadButton={!!generatedSceneUrlForDownload && !isLoading && !persistedOrbPosition}
          downloadUrl={generatedSceneUrlForDownload}
          openSceneDialogRef={sceneUploaderOpenRef}
          canAdjust={
            !!(
              generatedSceneUrlForDownload &&
              !isLoading &&
              lastDropRelativePosition &&
              originalSceneImage
            )
          }
          onAdjustScale={handleAdjustScale}
          canChangeScene={!!(sceneImage && !isLoading)}
          onChangeScene={() => sceneUploaderOpenRef.current?.()}
          canReset={!!(productImageFile && sceneImage && !isLoading)}
          onReset={handleReset}
        />
        <div className="text-center mt-10 min-h-[8rem] flex flex-col justify-center items-center">
          {isLoading ? (
            <div className="animate-fade-in w-full">
              <ProgressBar value={progress} label={loadingMessages[loadingMessageIndex]} />
            </div>
          ) : (
            <p className="text-zinc-500 animate-fade-in">
              Click to select a location in the scene, then press Generate.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-zinc-800 flex items-center justify-center p-4 md:p-8">
      <div className="flex flex-col items-center gap-12 w-full">
        <Header />
        <ProgressSteps currentStep={currentStep} steps={steps} />
        <main className="w-full">{renderContent()}</main>
      </div>
      <DebugModal
        isOpen={isDebugModalOpen}
        onClose={() => setIsDebugModalOpen(false)}
        imageUrl={debugImageUrl}
        prompt={debugPrompt}
      />
      {/* Hidden file inputs for Change buttons */}
      <input
        type="file"
        ref={productFileInputRef}
        className="hidden"
        accept="image/png, image/jpeg"
        onChange={handleProductFileInputChange}
      />
    </div>
  )
}

export default App
