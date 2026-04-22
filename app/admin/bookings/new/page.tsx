"use client"

import { format } from "date-fns"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFileUpload } from "@/hooks/use-file-upload"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { mockRooms, mockLocations } from "@/lib/mock"
import { useCreateBooking, useRooms } from "@/lib/hooks"
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from "@/components/ui/cropper"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import {
  SaveIcon,
  ArrowLeftIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
  CircleUserRoundIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

const today = new Date()
const timeSlots = [
  { available: false, time: "09:00" },
  { available: false, time: "09:30" },
  { available: true, time: "10:00" },
  { available: true, time: "10:30" },
  { available: true, time: "11:00" },
  { available: true, time: "11:30" },
  { available: false, time: "12:00" },
  { available: true, time: "12:30" },
  { available: true, time: "13:00" },
  { available: true, time: "13:30" },
  { available: true, time: "14:00" },
  { available: false, time: "14:30" },
  { available: false, time: "15:00" },
  { available: true, time: "15:30" },
  { available: true, time: "16:00" },
  { available: true, time: "16:30" },
  { available: true, time: "17:00" },
  { available: true, time: "17:30" },
]

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours = "0", minutes = "0"] = time.split(":")
  const totalMinutes = Number(hours) * 60 + Number(minutes) + minutesToAdd
  const normalizedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const endHours = Math.floor(normalizedMinutes / 60)
  const endMinutes = normalizedMinutes % 60

  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
    2,
    "0"
  )}`
}

// Helper function to create a loaded image element from a URL.
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  outputWidth: number = pixelCrop.width,
  outputHeight: number = pixelCrop.height
): Promise<Blob | null> {
  try {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      return null
    }

    canvas.width = outputWidth
    canvas.height = outputHeight

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputWidth,
      outputHeight
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, "image/jpeg")
    })
  } catch (error) {
    console.error("Error in getCroppedImg:", error)
    return null
  }
}

export default function NewBookingPage() {
  const t = useTranslations("bookings.new")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const createBookingMutation = useCreateBooking()
  const { data: roomsData } = useRooms(1, 200)
  const [date, setDate] = useState<Date>(today)
  const [time, setTime] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card")
  const [isExistingCustomer, setIsExistingCustomer] = useState(false)
  const [customerPin, setCustomerPin] = useState("")
  const [isVerifyingCustomerPin, setIsVerifyingCustomerPin] = useState(false)
  const [isCustomerPinVerified, setIsCustomerPinVerified] = useState(false)
  const [customerPinVerificationError, setCustomerPinVerificationError] =
    useState<string | null>(null)
  const [customerPinVerificationSuccess, setCustomerPinVerificationSuccess] =
    useState<string | null>(null)
  const [bookingTitle, setBookingTitle] = useState("")
  const [bookingDescription, setBookingDescription] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [selectedRoom, setSelectedRoom] = useState("")
  const [email, setEmail] = useState("")
  const [isOtpRequested, setIsOtpRequested] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isConfirmingOtp, setIsConfirmingOtp] = useState(false)
  const [otpRequestError, setOtpRequestError] = useState<string | null>(null)
  const [otpRequestSuccess, setOtpRequestSuccess] = useState<string | null>(
    null
  )
  const [otp, setOtp] = useState("")
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [zoom, setZoom] = useState(1)

  const [
    { files, isDragging },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "image/*",
  })

  const previewUrl = files[0]?.preview || null
  const fileId = files[0]?.id
  const previousFileIdRef = useRef<string | undefined | null>(null)

  const handleCropChange = useCallback(
    (
      pixels: { x: number; y: number; width: number; height: number } | null
    ) => {
      setCroppedAreaPixels(pixels)
    },
    []
  )

  const handleApply = async () => {
    if (!previewUrl || !fileId || !croppedAreaPixels) {
      console.error("Missing crop data", {
        previewUrl,
        fileId,
        croppedAreaPixels,
      })
      if (fileId) {
        removeFile(fileId)
        setCroppedAreaPixels(null)
      }
      return
    }

    try {
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels)

      if (!croppedBlob) {
        throw new Error("Failed to generate cropped image blob")
      }

      const newFinalUrl = URL.createObjectURL(croppedBlob)

      if (finalImageUrl) {
        URL.revokeObjectURL(finalImageUrl)
      }

      setFinalImageUrl(newFinalUrl)
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error during apply:", error)
      setIsDialogOpen(false)
    }
  }

  useEffect(() => {
    const currentFinalUrl = finalImageUrl
    return () => {
      if (currentFinalUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(currentFinalUrl)
      }
    }
  }, [finalImageUrl])

  useEffect(() => {
    if (fileId && fileId !== previousFileIdRef.current) {
      setIsDialogOpen(true)
      setCroppedAreaPixels(null)
      setZoom(1)
    }

    previousFileIdRef.current = fileId
  }, [fileId])

  const handleRemoveFinalImage = () => {
    if (finalImageUrl) {
      URL.revokeObjectURL(finalImageUrl)
    }
    if (fileId) {
      removeFile(fileId)
    }
    setFinalImageUrl(null)
  }

  const handleRequestOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || isSendingOtp || isEmailVerified) return

    setIsSendingOtp(true)
    setOtpRequestError(null)
    setOtpRequestSuccess(null)

    try {
      const response = await fetch("/api/auth/email-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        setOtpRequestError(
          typeof json?.error === "string"
            ? json.error
            : t("messages.otpError")
        )
        return
      }

      const json = (await response.json().catch(() => null)) as {
        alreadyVerified?: boolean
        message?: string
      } | null

      if (json?.alreadyVerified) {
        setIsOtpRequested(false)
        setIsEmailVerified(true)
        setOtp("")
        setOtpRequestSuccess(
          typeof json.message === "string"
            ? json.message
            : t("messages.alreadyVerified")
        )
        return
      }

      setIsOtpRequested(true)
      setIsEmailVerified(false)
      setOtp("")
      setOtpRequestSuccess(
        typeof json?.message === "string"
          ? json.message
          : t("messages.otpSentSuccess")
      )
    } catch {
      setOtpRequestError(t("messages.otpError"))
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleConfirmOtp = async () => {
    if (otp.length !== 6 || isConfirmingOtp) return

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setOtpRequestError(t("messages.emailRequired"))
      return
    }

    setIsConfirmingOtp(true)
    setOtpRequestError(null)

    try {
      const response = await fetch("/api/auth/email-verification/success", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        setOtpRequestError(
          typeof json?.error === "string"
            ? json.error
            : t("messages.otpVerifyError")
        )
        return
      }

      setIsEmailVerified(true)
      setOtpRequestSuccess(t("messages.otpVerifySuccess"))
    } catch {
      setOtpRequestError(t("messages.otpVerifyError"))
    } finally {
      setIsConfirmingOtp(false)
    }
  }

  const handleVerifyCustomerPin = async () => {
    const pin = customerPin.trim()

    if (!pin) {
      setCustomerPinVerificationSuccess(null)
      setCustomerPinVerificationError(t("messages.pinRequired"))
      return
    }

    setIsVerifyingCustomerPin(true)
    setCustomerPinVerificationError(null)
    setCustomerPinVerificationSuccess(null)

    try {
      const response = await fetch("/api/v1/bookings/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pin,
          bookingDate: format(date, "yyyy-MM-dd"),
          bookingEndTime: addMinutesToTime(time ?? "00:00", 60),
        }),
      })

      const json = (await response.json().catch(() => null)) as {
        verified?: boolean
        message?: string
        error?: string
      } | null

      if (!response.ok || !json?.verified) {
        setIsCustomerPinVerified(false)
        setCustomerPinVerificationSuccess(null)
        setCustomerPinVerificationError(
          typeof json?.error === "string"
            ? json.error
            : t("messages.pinError")
        )
        return
      }

      setIsCustomerPinVerified(true)
      setCustomerPinVerificationError(null)
      setCustomerPinVerificationSuccess(
        typeof json.message === "string"
          ? json.message
          : t("messages.pinVerified")
      )
    } catch {
      setIsCustomerPinVerified(false)
      setCustomerPinVerificationSuccess(null)
      setCustomerPinVerificationError(
        t("messages.pinError")
      )
    } finally {
      setIsVerifyingCustomerPin(false)
    }
  }

  const handleCreateBooking = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    const title = bookingTitle.trim()

    if (!title) {
      toast.error(t("messages.titleRequired"))
      return
    }

    if (!selectedLocation) {
      toast.error(t("messages.locationRequired"))
      return
    }

    if (!selectedRoom) {
      toast.error(t("messages.roomRequired"))
      return
    }

    if (!time) {
      toast.error(t("messages.timeRequired"))
      return
    }

    if (!normalizedEmail) {
      toast.error(t("messages.emailRequired"))
      return
    }

    if (!phoneNumber.trim()) {
      toast.error(t("messages.phoneRequired"))
      return
    }

    if (isExistingCustomer && !customerPin.trim()) {
      toast.error(t("messages.pinRequired"))
      return
    }

    if (isExistingCustomer && !isCustomerPinVerified) {
      toast.error(t("messages.verifyPinFirst"))
      return
    }

    if (!isEmailVerified) {
      toast.error(t("messages.verifyEmailFirst"))
      return
    }

    try {
      const selectedLocationOption = mockLocations.find(
        (location) => location.id === selectedLocation
      )
      const selectedRoomOption = mockRooms.find(
        (room) => room.id === selectedRoom
      )
      const selectedRoomRecord = roomsData?.data?.find(
        (room) => String(room.id) === selectedRoom
      )
      const computedAmount = Number(selectedRoomRecord?.price ?? 0)

      if (
        paymentMethod === "credit_card" &&
        (!Number.isFinite(computedAmount) || computedAmount <= 0)
      ) {
        toast.error(t("messages.priceRequired"))
        return
      }

      const result = await createBookingMutation.mutateAsync({
        name: title,
        organizer: title,
        purpose: bookingDescription.trim() || undefined,
        branch_id: Number(selectedLocation),
        room_id: Number(selectedRoom),
        branch: selectedLocationOption
          ? {
              id: Number(selectedLocationOption.id),
              name: selectedLocationOption.name,
            }
          : undefined,
        room: selectedRoomOption
          ? { id: Number(selectedRoomOption.id), name: selectedRoomOption.name }
          : undefined,
        date: format(date, "yyyy-MM-dd"),
        start_time: time,
        end_time: addMinutesToTime(time, 60),
        email: normalizedEmail,
        phone: phoneNumber.trim(),
        existing_customer: isExistingCustomer,
        pin: isExistingCustomer ? customerPin.trim() : undefined,
        status: "pending",
        payment_method: paymentMethod,
        payment_status: isExistingCustomer ? "waived" : "pending",
        total_amount:
          paymentMethod === "credit_card" ? computedAmount.toFixed(2) : "0.00",
        discount_amount: "0.00",
        transaction_id: undefined,
      })

      toast.success(t("messages.success"))
      if (paymentMethod === "credit_card" && result?.paymentUrl) {
        window.location.assign(result.paymentUrl)
        return
      }

      router.push("/admin/bookings")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("messages.error")
      )
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-0">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={{
          label:
            createBookingMutation.status === "pending"
              ? t("creating")
              : t("createBooking"),
          icon: <SaveIcon className="size-4" />,
          onClick: handleCreateBooking,
          disabled: createBookingMutation.status === "pending",
        }}
        secondaryAction={{
          label: t("back"),
          icon: <ArrowLeftIcon className="size-4" />,
          href: "/admin/bookings",
        }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("bookingDetails")}</CardTitle>
              <CardDescription>{t("fillInfo")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("bookingTitle")}</Label>
                <Input
                  placeholder={t("titlePlaceholder")}
                  value={bookingTitle}
                  onChange={(event) => setBookingTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("descriptionLabel")}</Label>
                <Textarea
                  placeholder={t("descriptionPlaceholder")}
                  rows={2}
                  value={bookingDescription}
                  onChange={(event) =>
                    setBookingDescription(event.target.value)
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("location")}</Label>
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("selectLocation")} />
                    </SelectTrigger>
                    <SelectContent>
                      {mockLocations
                        .filter((l) => l.isActive)
                        .map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("room")}</Label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("selectRoom")} />
                    </SelectTrigger>
                    <SelectContent>
                      {mockRooms
                        .filter((r) => r.status === "available")
                        .map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name} ({t("capacity", { count: room.capacity })})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("email")}</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    className="min-w-0 flex-1"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(event) => {
                      if (email !== event.target.value) {
                        setIsEmailVerified(false)
                        setIsOtpRequested(false)
                        setOtp("")
                      }
                      setEmail(event.target.value)
                      setOtpRequestError(null)
                      setOtpRequestSuccess(null)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRequestOtp}
                    disabled={!email || isEmailVerified || isSendingOtp}
                  >
                    {isEmailVerified
                      ? t("verified")
                      : isSendingOtp
                        ? t("sending")
                        : t("verify")}
                  </Button>
                </div>
                {otpRequestError ? (
                  <p className="text-sm text-destructive">{otpRequestError}</p>
                ) : null}
                {otpRequestSuccess ? (
                  <p className="text-sm text-muted-foreground">
                    {otpRequestSuccess}
                  </p>
                ) : null}
                {isOtpRequested && !isEmailVerified ? (
                  <div className="space-y-2 pt-2">
                    <Label>{t("otpLabel")}</Label>
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                    >
                      <InputOTPGroup className="">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <InputOTPSlot key={idx} index={idx} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={handleConfirmOtp}
                        disabled={otp.length !== 6 || isConfirmingOtp}
                      >
                        {isConfirmingOtp ? t("confirming") : t("confirmCode")}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {t("otpSent")}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>{t("phone")}</Label>
                <PhoneInput
                  placeholder="+966 5 5555 5555"
                  defaultCountry="SA"
                  international
                  value={phoneNumber}
                  onChange={(value) => setPhoneNumber(value || "")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("photo")}</Label>
                <div className="flex-inline gap-2">
                  <div className="relative inline-flex">
                    <button
                      aria-label={
                        finalImageUrl ? t("changePhoto") : t("uploadPhoto")
                      }
                      className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-input bg-muted/50 transition-colors hover:bg-muted"
                      data-dragging={isDragging || undefined}
                      onClick={openFileDialog}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      type="button"
                    >
                      {finalImageUrl ? (
                        <img
                          alt="Guest photo"
                          className="h-full w-full object-cover"
                          src={finalImageUrl}
                        />
                      ) : previewUrl ? (
                        <img
                          alt="Guest preview"
                          className="h-full w-full object-cover"
                          src={previewUrl}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <CircleUserRoundIcon className="size-4 opacity-60" />
                        </div>
                      )}
                    </button>
                    {finalImageUrl && (
                      <Button
                        aria-label={t("removePhoto")}
                        className="absolute top-0 right-0 h-6 w-6 rounded-full border-2 border-background bg-background shadow-sm"
                        onClick={handleRemoveFinalImage}
                        size="icon"
                        type="button"
                        variant="secondary"
                      >
                        <XIcon className="size-3" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                  <input
                    {...getInputProps({
                      "aria-label": "Upload photo file",
                      className: "sr-only",
                    })}
                    tabIndex={-1}
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("photoDescription")}
                  </p>
                </div>
              </div>
              <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
                <DialogContent className="gap-0 p-0 sm:max-w-140 *:[button]:hidden">
                  <DialogDescription className="sr-only">
                    {t("cropTitle")}
                  </DialogDescription>
                  <DialogHeader className="contents space-y-0 text-start">
                    <DialogTitle className="flex items-center justify-between border-b p-4 text-base">
                      <div className="flex items-center gap-2">
                        <Button
                          aria-label={t("cancel")}
                          className="-my-1 opacity-60"
                          onClick={() => setIsDialogOpen(false)}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <ArrowLeftIcon aria-hidden="true" />
                        </Button>
                        <span>{t("cropTitle")}</span>
                      </div>
                      <Button
                        autoFocus
                        className="-my-1"
                        disabled={!previewUrl}
                        onClick={handleApply}
                      >
                        {t("apply")}
                      </Button>
                    </DialogTitle>
                  </DialogHeader>
                  {previewUrl && (
                    <Cropper
                      className="h-96 sm:h-120"
                      image={previewUrl}
                      onCropChange={handleCropChange}
                      onZoomChange={setZoom}
                      zoom={zoom}
                    >
                      <CropperDescription />
                      <CropperImage />
                      <CropperCropArea />
                    </Cropper>
                  )}
                  <DialogFooter className="border-t px-4 py-6">
                    <div className="mx-auto flex w-full max-w-80 items-center gap-4">
                      <ZoomOutIcon
                        aria-hidden="true"
                        className="shrink-0 opacity-60"
                        size={16}
                      />
                      <Slider
                        aria-label="Zoom slider"
                        defaultValue={[1]}
                        max={3}
                        min={1}
                        onValueChange={(value) => setZoom(value[0])}
                        step={0.1}
                        value={[zoom]}
                      />
                      <ZoomInIcon
                        aria-hidden="true"
                        className="shrink-0 opacity-60"
                        size={16}
                      />
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{t("existingCustomer")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("existingCustomerDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={isExistingCustomer}
                    onCheckedChange={(checked) => {
                      setIsExistingCustomer(checked)
                      setIsCustomerPinVerified(false)
                      setCustomerPinVerificationError(null)
                      setCustomerPinVerificationSuccess(null)
                    }}
                  />
                </div>
              </div>
              {!isExistingCustomer ? (
                <div className="space-y-2">
                  <Label>{t("promoCode")}</Label>
                  <div className="flex gap-2">
                    <Input placeholder={t("enterCode")} />
                    <Button variant="outline">{t("applyCode")}</Button>
                  </div>
                </div>
              ) : null}

              {isExistingCustomer ? (
                <div className="space-y-2">
                  <Label>{t("enterPin")}</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="password"
                      value={customerPin}
                      onChange={(event) => {
                        setCustomerPin(event.target.value)
                        setIsCustomerPinVerified(false)
                        setCustomerPinVerificationError(null)
                        setCustomerPinVerificationSuccess(null)
                      }}
                      placeholder={t("pinPlaceholder")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVerifyCustomerPin}
                      disabled={
                        !customerPin.trim() ||
                        isVerifyingCustomerPin ||
                        isCustomerPinVerified
                      }
                    >
                      {isCustomerPinVerified
                        ? t("verified")
                        : isVerifyingCustomerPin
                          ? t("verifying")
                          : t("verify")}
                    </Button>
                  </div>
                  {customerPinVerificationError ? (
                    <p className="text-sm text-destructive">
                      {customerPinVerificationError}
                    </p>
                  ) : null}
                  {customerPinVerificationSuccess ? (
                    <p className="text-sm text-muted-foreground">
                      {customerPinVerificationSuccess}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    Existing customers verify with PIN instead of payment.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t("paymentMethod")}</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="grid gap-2 sm:grid-cols-3"
                  >
                    <label className="">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="credit_card" />
                        <span>{t("creditCard")}</span>
                      </div>
                    </label>
                    <label className="">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="bank_transfer" />
                        <span>{t("bankTransfer")}</span>
                      </div>
                    </label>
                    <label className="">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="cash" />
                        <span>{t("cashAtBranch")}</span>
                      </div>
                    </label>
                  </RadioGroup>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dateTime")}</CardTitle>
              <CardDescription>
                {t("selectDateTimeDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="flex flex-col gap-4 max-sm:flex-col sm:flex-row">
                  <div className="w-full sm:flex-1">
                    <Calendar
                      className="w-full p-2 sm:pe-5"
                      disabled={[{ before: today }]}
                      mode="single"
                      onSelect={(newDate) => {
                        if (newDate) {
                          setDate(newDate)
                          setTime(null)
                        }
                      }}
                      selected={date}
                    />
                  </div>
                  <div className="relative w-full max-sm:h-48 sm:w-60">
                    <div className="absolute inset-0 py-4 max-sm:border-t">
                      <ScrollArea className="h-full w-full sm:border-s">
                        <div className="space-y-3">
                          <div className="flex h-5 shrink-0 items-center px-5">
                            <p className="text-sm font-medium">
                              {format(date, "EEEE, d")}
                            </p>
                          </div>
                          <div className="grid gap-1.5 px-5 max-sm:grid-cols-2">
                            {timeSlots.map(({ time: timeSlot, available }) => (
                              <Button
                                className="w-full"
                                disabled={!available}
                                key={timeSlot}
                                onClick={() => setTime(timeSlot)}
                                size="sm"
                                variant={
                                  time === timeSlot ? "default" : "outline"
                                }
                              >
                                {timeSlot}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("bookingSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("roomRate")}</span>
                <span>{t("currency")} 0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("resources")}</span>
                <span>{t("currency")} 0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("discount")}</span>
                <span className="text-green-600">-{t("currency")} 0.00</span>
              </div>
              <div className="flex justify-between border-t pt-3 font-medium">
                <span>{t("total")}</span>
                <span>{t("currency")} 0.00</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
