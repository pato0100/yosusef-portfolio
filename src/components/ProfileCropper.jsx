import Cropper from "react-easy-crop"
import { useState, useCallback } from "react"

export default function ProfileCropper({ image, onCancel, onConfirm }) {
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

    const OUTPUT_SIZE = 512

    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE

    const ctx = canvas.getContext("2d")
    ctx.imageSmoothingQuality = "high"

    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    )

    const croppedBase64 = canvas.toDataURL("image/jpeg", 0.9)
    onConfirm(croppedBase64)
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">

      <div className="relative w-[400px] h-[400px] bg-black rounded-full overflow-hidden">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
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
          Confirm
        </button>
      </div>
    </div>
  )
}