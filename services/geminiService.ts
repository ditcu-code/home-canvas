import { GenerateContentResponse, GoogleGenAI } from "@google/genai"

// Helper to get intrinsic image dimensions from a File object
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file."))
      }
      const img = new Image()
      img.src = event.target.result as string
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = (err) => reject(new Error(`Image load error: ${err}`))
    }
    reader.onerror = (err) => reject(new Error(`File reader error: ${err}`))
  })
}

// Helper to crop a square image back to an original aspect ratio, removing padding.
const cropToOriginalAspectRatio = (
  imageDataUrl: string,
  originalWidth: number,
  originalHeight: number,
  targetDimension: number,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = imageDataUrl
    img.onload = () => {
      // Re-calculate the dimensions of the content area within the padded square image
      const aspectRatio = originalWidth / originalHeight
      let contentWidth, contentHeight
      if (aspectRatio > 1) {
        // Landscape
        contentWidth = targetDimension
        contentHeight = targetDimension / aspectRatio
      } else {
        // Portrait or square
        contentHeight = targetDimension
        contentWidth = targetDimension * aspectRatio
      }

      // Calculate the top-left offset of the content area
      const x = (targetDimension - contentWidth) / 2
      const y = (targetDimension - contentHeight) / 2

      const canvas = document.createElement("canvas")
      // Set canvas to the final, un-padded dimensions
      canvas.width = contentWidth
      canvas.height = contentHeight

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return reject(new Error("Could not get canvas context for cropping."))
      }

      // Draw the relevant part of the square generated image onto the new, smaller canvas
      ctx.drawImage(img, x, y, contentWidth, contentHeight, 0, 0, contentWidth, contentHeight)

      // Return the data URL of the newly cropped image
      resolve(canvas.toDataURL("image/jpeg", 0.95))
    }
    img.onerror = (err) => reject(new Error(`Image load error during cropping: ${err}`))
  })
}

// New resize logic inspired by the reference to enforce a consistent aspect ratio without cropping.
// It resizes the image to fit within a square and adds padding, ensuring a consistent
// input size for the AI model, which enhances stability.
const resizeImage = (file: File, targetDimension: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file."))
      }
      const img = new Image()
      img.src = event.target.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = targetDimension
        canvas.height = targetDimension

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          return reject(new Error("Could not get canvas context."))
        }

        // Fill the canvas with a neutral background to avoid transparency issues
        // and ensure a consistent input format for the model.
        // Use mid‑gray instead of black so the model isn't biased toward
        // very dark borders that can affect exposure/white balance.
        ctx.fillStyle = "#808080"
        ctx.fillRect(0, 0, targetDimension, targetDimension)

        // Calculate new dimensions to fit inside the square canvas while maintaining aspect ratio
        const aspectRatio = img.width / img.height
        let newWidth, newHeight

        if (aspectRatio > 1) {
          // Landscape image
          newWidth = targetDimension
          newHeight = targetDimension / aspectRatio
        } else {
          // Portrait or square image
          newHeight = targetDimension
          newWidth = targetDimension * aspectRatio
        }

        // Calculate position to center the image on the canvas
        const x = (targetDimension - newWidth) / 2
        const y = (targetDimension - newHeight) / 2

        // Draw the resized image onto the centered position
        ctx.drawImage(img, x, y, newWidth, newHeight)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name, {
                  type: "image/jpeg", // Force jpeg to handle padding color consistently
                  lastModified: Date.now(),
                }),
              )
            } else {
              reject(new Error("Canvas to Blob conversion failed."))
            }
          },
          "image/jpeg",
          0.95,
        )
      }
      img.onerror = (err) => reject(new Error(`Image load error: ${err}`))
    }
    reader.onerror = (err) => reject(new Error(`File reader error: ${err}`))
  })
}

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (
  file: File,
): Promise<{ inlineData: { mimeType: string; data: string } }> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

  const arr = dataUrl.split(",")
  if (arr.length < 2) throw new Error("Invalid data URL")
  const mimeMatch = arr[0].match(/:(.*?);/)
  if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL")

  const mimeType = mimeMatch[1]
  const data = arr[1]
  return { inlineData: { mimeType, data } }
}

// Helper to convert File to a data URL string
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Helper to draw a marker on an image and return a new File object
const markImage = async (
  paddedSquareFile: File,
  position: { xPercent: number; yPercent: number },
  originalDimensions: { originalWidth: number; originalHeight: number },
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(paddedSquareFile)
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file for marking."))
      }
      const img = new Image()
      img.src = event.target.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const targetDimension = canvas.width

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          return reject(new Error("Could not get canvas context for marking."))
        }

        // Draw the original (padded) image
        ctx.drawImage(img, 0, 0)

        // Recalculate the content area's dimensions and offset within the padded square canvas.
        // This is crucial to translate the content-relative percentages to the padded canvas coordinates.
        const { originalWidth, originalHeight } = originalDimensions
        const aspectRatio = originalWidth / originalHeight
        let contentWidth, contentHeight

        if (aspectRatio > 1) {
          // Landscape
          contentWidth = targetDimension
          contentHeight = targetDimension / aspectRatio
        } else {
          // Portrait or square
          contentHeight = targetDimension
          contentWidth = targetDimension * aspectRatio
        }

        const offsetX = (targetDimension - contentWidth) / 2
        const offsetY = (targetDimension - contentHeight) / 2

        // Calculate the marker's coordinates relative to the actual image content
        const markerXInContent = (position.xPercent / 100) * contentWidth
        const markerYInContent = (position.yPercent / 100) * contentHeight

        // The final position on the canvas is the content's offset plus the relative position
        const finalMarkerX = offsetX + markerXInContent
        const finalMarkerY = offsetY + markerYInContent

        // Make radius proportional to image size, but with a minimum
        const markerRadius = Math.max(5, Math.min(canvas.width, canvas.height) * 0.015)

        // Draw the marker (red circle with white outline) at the corrected coordinates
        ctx.beginPath()
        ctx.arc(finalMarkerX, finalMarkerY, markerRadius, 0, 2 * Math.PI, false)
        ctx.fillStyle = "red"
        ctx.fill()
        ctx.lineWidth = markerRadius * 0.2
        ctx.strokeStyle = "white"
        ctx.stroke()

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], `marked-${paddedSquareFile.name}`, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }),
              )
            } else {
              reject(new Error("Canvas to Blob conversion failed during marking."))
            }
          },
          "image/jpeg",
          0.95,
        )
      }
      img.onerror = (err) => reject(new Error(`Image load error during marking: ${err}`))
    }
    reader.onerror = (err) => reject(new Error(`File reader error during marking: ${err}`))
  })
}

// Estimate local lighting (color/tone) and sharpness near the drop point on the
// padded square scene image. Returns a short natural‑language description that
// we can feed back into the prompt to help the model match lighting/DOF.
const analyzeLocalLighting = async (
  paddedSquareFile: File,
  position: { xPercent: number; yPercent: number },
  originalDimensions: { originalWidth: number; originalHeight: number },
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(paddedSquareFile)
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file for lighting analysis."))
      }
      const img = new Image()
      img.src = event.target.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("Could not get canvas context for analysis."))
        ctx.drawImage(img, 0, 0)

        const targetDimension = canvas.width
        const { originalWidth, originalHeight } = originalDimensions
        const aspectRatio = originalWidth / originalHeight
        let contentWidth: number, contentHeight: number
        if (aspectRatio > 1) {
          contentWidth = targetDimension
          contentHeight = targetDimension / aspectRatio
        } else {
          contentHeight = targetDimension
          contentWidth = targetDimension * aspectRatio
        }
        const offsetX = (targetDimension - contentWidth) / 2
        const offsetY = (targetDimension - contentHeight) / 2

        const cx = offsetX + (position.xPercent / 100) * contentWidth
        const cy = offsetY + (position.yPercent / 100) * contentHeight

        // Sample a square patch around the target (~7% of image size)
        const patch = Math.max(16, Math.round(targetDimension * 0.07))
        const x = Math.max(0, Math.min(Math.round(cx - patch / 2), targetDimension - patch))
        const y = Math.max(0, Math.min(Math.round(cy - patch / 2), targetDimension - patch))
        const imgData = ctx.getImageData(x, y, patch, patch)
        const data = imgData.data // RGBA

        let rSum = 0,
          gSum = 0,
          bSum = 0
        let lumaPrevRow: number[] = new Array(patch).fill(0)
        let sharpnessAccum = 0
        let count = 0
        for (let py = 0; py < patch; py++) {
          let prevLuma = 0
          for (let px = 0; px < patch; px++) {
            const idx = (py * patch + px) * 4
            const r = data[idx]
            const g = data[idx + 1]
            const b = data[idx + 2]
            rSum += r
            gSum += g
            bSum += b
            count++
            // simple luma
            const l = 0.2126 * r + 0.7152 * g + 0.0722 * b
            // accumulate abs gradient vs left and top to estimate sharpness
            if (px > 0) sharpnessAccum += Math.abs(l - prevLuma)
            if (py > 0) sharpnessAccum += Math.abs(l - lumaPrevRow[px])
            prevLuma = l
            lumaPrevRow[px] = l
          }
        }

        const rAvg = rSum / count
        const gAvg = gSum / count
        const bAvg = bSum / count
        const max = Math.max(rAvg, gAvg, bAvg)
        const min = Math.min(rAvg, gAvg, bAvg)
        const lightness = (max + min) / 510 // 0..1
        const saturation = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255))
        let hue = 0
        if (max !== min) {
          if (max === rAvg) hue = 60 * (((gAvg - bAvg) / (max - min)) % 6)
          else if (max === gAvg) hue = 60 * ((bAvg - rAvg) / (max - min) + 2)
          else hue = 60 * ((rAvg - gAvg) / (max - min) + 4)
        }
        if (hue < 0) hue += 360

        const isWarm = hue >= 15 && hue <= 70 && saturation > 0.05
        const hex = `#${[rAvg, gAvg, bAvg]
          .map((v) => Math.round(v).toString(16).padStart(2, "0"))
          .join("")}`

        // Normalize sharpness by number of comparisons to keep ~0..1 range then scale
        const comparisons = patch * (patch - 1) * 2 // horiz + vert
        const sharpness = comparisons > 0 ? sharpnessAccum / (comparisons * 255) : 0 // 0..~1
        const sharpLabel =
          sharpness < 0.05
            ? "soft/blurred (shallow DOF)"
            : sharpness < 0.12
            ? "moderately sharp"
            : "very sharp"

        const tempLabel = isWarm ? "warm, amber/orange-biased" : "cool/neutral"
        const satPct = Math.round(saturation * 100)
        const lightPct = Math.round(lightness * 100)
        const description = `Local light near placement is ${tempLabel} (avg ${hex}, hue ${Math.round(
          hue,
        )}°, sat ${satPct}%, lightness ${lightPct}%). The area appears ${sharpLabel}.`
        resolve(description)
      }
      img.onerror = (err) => reject(new Error(`Image load error during analysis: ${err}`))
    }
    reader.onerror = (err) => reject(new Error(`File reader error during analysis: ${err}`))
  })
}

/**
 * Generates a composite image using a multi-modal AI model.
 * The model takes a product image, a scene image, and a text prompt
 * to generate a new image with the product placed in the scene.
 * @param objectImage The file for the object to be placed.
 * @param objectDescription A text description of the object.
 * @param environmentImage The file for the background environment.
 * @param environmentDescription A text description of the environment.
 * @param dropPosition The relative x/y coordinates (0-100) where the product was dropped.
 * @returns A promise that resolves to an object containing the base64 data URL of the generated image and the debug image.
 */
export const generateCompositeImage = async (
  objectImage: File,
  _objectDescription: string,
  environmentImage: File,
  _environmentDescription: string,
  dropPosition: { xPercent: number; yPercent: number },
  scaleFactor: number = 1,
): Promise<{ finalImageUrl: string; debugImageUrl: string; finalPrompt: string }> => {
  console.log("Starting multi-step image generation process...")
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! })

  // Get original scene dimensions for final cropping and correct marker placement
  const { width: originalWidth, height: originalHeight } = await getImageDimensions(
    environmentImage,
  )

  // Define standard dimension for model inputs
  const MAX_DIMENSION = 1024

  // STEP 1: Prepare images by resizing
  console.log("Resizing product and scene images...")
  const resizedObjectImage = await resizeImage(objectImage, MAX_DIMENSION)
  const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION)

  // STEP 2: Mark the resized scene image for the description model and debug view
  console.log("Marking scene image for analysis...")
  // Pass original dimensions to correctly calculate marker position on the padded image
  const markedResizedEnvironmentImage = await markImage(resizedEnvironmentImage, dropPosition, {
    originalWidth,
    originalHeight,
  })

  // The debug image is now the marked one.
  const debugImageUrl = await fileToDataUrl(markedResizedEnvironmentImage)

  // STEP 2.5: Analyze local lighting/DOF around the drop point to guide rendering
  const localLightingHint = await analyzeLocalLighting(resizedEnvironmentImage, dropPosition, {
    originalWidth,
    originalHeight,
  })

  // STEP 3: Generate semantic location description with Gemini 2.5 Flash Lite using the MARKED image
  console.log("Generating semantic location description with gemini-2.5-flash-lite...")

  const markedEnvironmentImagePart = await fileToPart(markedResizedEnvironmentImage)

  const descriptionPrompt = `
You are an expert scene analyst. I will provide you with an image that has a red marker on it.
Your task is to provide a very dense, semantic description of what is at the exact location of the red marker.
Be specific about surfaces, materials, and spatial relationships. This description will be used to guide another AI in placing a jewelry piece.

Example semantic descriptions:
- "The jewelry location is on the dark grey fabric of the sofa cushion, in the middle section, slightly to the left of the white throw pillow."
- "The jewelry location is on the light-colored wooden dresser top, inside a soft window light patch, about a foot from the leg of the brown leather armchair."
- "The jewelry location is on the white marble countertop, just to the right of the stainless steel sink and behind the green potted plant."

On top of the semantic description above, give a rough relative-to-image description.

Example relative-to-image descriptions:
- "The jewelry location is about 10% away from the bottom-left of the image."
- "The jewelry location is about 20% away from the right of the image."

Provide only the two descriptions concatenated in a few sentences.
`

  let semanticLocationDescription = ""
  try {
    const descriptionResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: { parts: [{ text: descriptionPrompt }, markedEnvironmentImagePart] },
    })
    semanticLocationDescription = descriptionResponse.text
    console.log("Generated description:", semanticLocationDescription)
  } catch (error) {
    console.error("Failed to generate semantic location description:", error)
    // Fallback to a generic statement if the description generation fails
    semanticLocationDescription = `at the specified location.`
  }

  // STEP 4: Generate composite image using the CLEAN image and the description
  console.log("Preparing to generate composite image...")

  const objectImagePart = await fileToPart(resizedObjectImage)
  const cleanEnvironmentImagePart = await fileToPart(resizedEnvironmentImage) // IMPORTANT: Use clean image
  const scalePercent = Math.round(scaleFactor * 100)

  const prompt = `
**Role**
You are a visual composition expert specializing in jewelry. Your task is to take a 'jewelry piece' image and seamlessly integrate it into a 'scene' image, adjusting for perspective, lighting, reflections, and scale.

**Inputs**
- Jewelry piece: the first image. Ignore any background or padding; treat non-jewelry areas as transparent and preserve fine edges.
- Scene (clean): the second image. Ignore any padding.
- Scene (marked): the third image is the same scene with a red circular marker indicating the precise placement region. Use this as a spatial hint only; do not include any red marker in the output.

**Local Lighting Hint**
- ${localLightingHint}
- Use this to set white balance/tint of metal and gemstones, the highlight color, and the blur amount to match the local depth of field.

**Placement (Critical)**
- Place the jewelry at the exact location described below. Place it only once.
- Jewelry placement description: "${semanticLocationDescription}"

**Replacement Rule (Critical)**
- If the specified placement region overlaps an existing jewelry item (earring, stud, hoop, ring, necklace/pendant/chain, bracelet/bangle, piercing), remove the existing item completely and replace it with the new one.
- Do not stack or overlay. Do not show both old and new jewelry. Exactly one jewelry item must remain after replacement.
- For earrings: attach at the ear piercing. Remove any existing earring (stud/hoop/drop/clip) entirely; preserve the piercing hole and realistic contact/occlusion with the ear and hair.
- For rings: remove any existing ring/band; wrap the new ring around the finger with correct occlusion (finger should cover the inner band where appropriate).
- For necklaces: remove any existing chain/pendant/choker; drape the new chain naturally along the neck/collarbone with correct occlusions from hair/clothing.
- For bracelets: remove any existing bracelet/bangle; wrap the new bracelet around the wrist with correct occlusion.

**Jewelry Rendering Requirements**
- Preserve delicate details: chains, prongs, clasps, filigree edges, and fine contours. Avoid halos or matte cutouts around edges.
- Use the provided jewelry design as-is. Do not invent or change geometry, silhouette, or materials; only apply physically plausible re-lighting and reflections. If the product photo shows a pair, use just one item appropriate for the placement.
- Metals: match material and finish (gold/silver/platinum/rose gold). Maintain realistic specular highlights and reflections based on scene lighting.
- Gemstones/diamonds: maintain color, facets, dispersion, and sparkle without overexposure; ensure highlights align with the scene’s light direction.
- Shadows and contact: add accurate contact shadows/occlusion where the jewelry touches surfaces, skin, or fabric. Use appropriate softness based on distance to surface and light size.
- Surfaces: on glossy surfaces (e.g., marble, lacquer), include subtle reflection/blur; on fabric/wood, ensure correct resting and slight indentation if applicable.
- Skin/clothing: align to curvature; add micro‑occlusion along contact; avoid floating.
 - Scale: keep realistic proportions (rings relative to a finger, earrings to an ear, pendants to collarbone, bracelets to a wrist, etc.). Then adjust the final jewelry size to approximately ${scalePercent}% of that realistic size.

**Global Requirements**
- Match the scene’s perspective, white balance, noise, depth of field, and grain. Do not simply paste; re-render to fit context.
- Add a subtle light wrap (2–4 px) using surrounding scene color around jewelry edges for integration, and match noise/grain level to the scene. If the local area is soft, slightly blur the jewelry to the same softness.
- Do not return the original scene without the jewelry. The final image must include the jewelry at the specified location.

Output only the composed image (no text).
`

  const textPart = { text: prompt }

  console.log("Sending images and augmented prompt...")

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [objectImagePart, cleanEnvironmentImagePart, markedEnvironmentImagePart, textPart],
    },
  })

  console.log("Received response.")

  const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData,
  )

  if (imagePartFromResponse?.inlineData) {
    const { mimeType, data } = imagePartFromResponse.inlineData
    console.log(`Received image data (${mimeType}), length:`, data.length)
    const generatedSquareImageUrl = `data:${mimeType};base64,${data}`

    console.log("Cropping generated image to original aspect ratio...")
    const finalImageUrl = await cropToOriginalAspectRatio(
      generatedSquareImageUrl,
      originalWidth,
      originalHeight,
      MAX_DIMENSION,
    )

    return { finalImageUrl, debugImageUrl, finalPrompt: prompt }
  }

  console.error("Model response did not contain an image part.", response)
  throw new Error("The AI model did not return an image. Please try again.")
}
