import Cropper from "react-easy-crop"
import { useState, useCallback } from "react"

export default function CoverCropper({ image, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  async function createCroppedImage() {
    const canvas = document.createElement("canvas")
    const img = new Image()
    img.src = image

    await new Promise(resolve => {
      img.onload = resolve
    })

    const OUTPUT_WIDTH = 1200
const OUTPUT_HEIGHT = 675

canvas.width = OUTPUT_WIDTH
canvas.height = OUTPUT_HEIGHT

ctx.imageSmoothingQuality = "high"
ctx.drawImage(
  img,
  croppedAreaPixels.x,
  croppedAreaPixels.y,
  croppedAreaPixels.width,
  croppedAreaPixels.height,
  0,
  0,
  OUTPUT_WIDTH,
  OUTPUT_HEIGHT
)

    const croppedBase64 = canvas.toDataURL("image/jpeg", 0.9)
    onConfirm(croppedBase64)
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">

      <div className="relative w-[500px] h-[300px] bg-black">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={16 / 9}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="flex gap-4 mt-4">
        <button onClick={onCancel} className="btn btn-ghost">
          Cancel
        </button>
        <button onClick={createCroppedImage} className="btn btn-primary">
          Confirm Crop
        </button>
      </div>
    </div>
  )
}