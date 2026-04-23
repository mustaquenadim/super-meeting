"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  ArrowLeftIcon,
  CameraIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layouts/page-header"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

const AVATAR_BUCKET = "avatars"

type Area = { x: number; y: number; width: number; height: number }

type ProfileForm = {
  firstName: string
  lastName: string
  role: string
  email: string
  phone: string
  location: string
  bio: string
  avatarUrl: string
}

const emptyProfile: ProfileForm = {
  firstName: "",
  lastName: "",
  role: "",
  email: "",
  phone: "",
  location: "",
  bio: "",
  avatarUrl: "",
}

function getProfileFromUser(
  user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]
): ProfileForm {
  const metadata = user?.user_metadata ?? {}
  const name =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : (user?.email ?? "")

  const [firstName = "", ...rest] = name.split(" ")

  return {
    firstName:
      typeof metadata.first_name === "string" ? metadata.first_name : firstName,
    lastName:
      typeof metadata.last_name === "string"
        ? metadata.last_name
        : rest.join(" "),
    role: typeof metadata.role === "string" ? metadata.role : "",
    email: user?.email ?? "",
    phone:
      typeof metadata.phone === "string" ? metadata.phone : (user?.phone ?? ""),
    location: typeof metadata.location === "string" ? metadata.location : "",
    bio: typeof metadata.bio === "string" ? metadata.bio : "",
    avatarUrl:
      typeof metadata.avatar_url === "string"
        ? metadata.avatar_url
        : typeof metadata.avatarUrl === "string"
          ? metadata.avatarUrl
          : "",
  }
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })

async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth = 256,
  outputHeight = 256
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
      canvas.toBlob(
        (blob) => {
          resolve(blob)
        },
        "image/jpeg",
        0.92
      )
    })
  } catch (error) {
    console.error("Failed to crop image", error)
    return null
  }
}

async function uploadAvatarToStorage(
  userId: string,
  blob: Blob
): Promise<string> {
  const filePath = `${userId}/profile.jpg`
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, blob, { upsert: true })

  if (uploadError) {
    throw uploadError
  }

  const { data: publicData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath)

  if (!publicData?.publicUrl) {
    throw new Error("Failed to get public avatar URL")
  }

  return publicData.publicUrl
}

export default function ProfilePage() {
  const t = useTranslations("profile")
  const router = useRouter()
  const [profile, setProfile] = React.useState<ProfileForm>(emptyProfile)
  const [authEmail, setAuthEmail] = React.useState("")
  const [userId, setUserId] = React.useState<string | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = React.useState(false)
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(
    null
  )
  const [zoom, setZoom] = React.useState(1)

  const [
    { files, isDragging: isAvatarDragging },
    {
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
    },
  ] = useFileUpload({
    accept: "image/*",
  })

  const previewUrl = files[0]?.preview ?? null
  const fileId = files[0]?.id ?? null
  const previousFileIdRef = React.useRef<string | null>(null)

  const updateField = React.useCallback(
    <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
      setProfile((current) => ({ ...current, [key]: value }))
    },
    []
  )

  React.useEffect(() => {
    let mounted = true

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!mounted) return

        if (error || !data.user) {
          router.replace("/auth/login")
          return
        }

        const nextProfile = getProfileFromUser(data.user)
        setUserId(data.user.id)
        setAuthEmail(nextProfile.email)
        setProfile(nextProfile)
        setIsLoading(false)
      })
      .catch(() => {
        if (mounted) {
          router.replace("/auth/login")
        }
      })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      if (!session?.user) {
        router.replace("/auth/login")
        return
      }

      const nextProfile = getProfileFromUser(session.user)
      setUserId(session.user.id)
      setAuthEmail(nextProfile.email)
      setProfile(nextProfile)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [router])

  React.useEffect(() => {
    if (fileId && fileId !== previousFileIdRef.current) {
      setIsAvatarDialogOpen(true)
      setCroppedAreaPixels(null)
      setZoom(1)
    }

    previousFileIdRef.current = fileId
  }, [fileId])

  const handleAvatarCropChange = React.useCallback((pixels: Area | null) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const closeAvatarDialog = React.useCallback(() => {
    setIsAvatarDialogOpen(false)

    if (fileId) {
      removeFile(fileId)
    }

    setCroppedAreaPixels(null)
    setZoom(1)
  }, [fileId, removeFile])

  const handleApplyAvatar = React.useCallback(async () => {
    if (!previewUrl || !croppedAreaPixels) {
      toast.error(t("messages.selectCropFirst"))
      return
    }

    if (!userId) {
      toast.error(t("messages.invalidUser"))
      return
    }

    const blob = await getCroppedImageBlob(previewUrl, croppedAreaPixels)

    if (!blob) {
      toast.error(t("messages.avatarProcessError"))
      return
    }

    try {
      const publicUrl = await uploadAvatarToStorage(userId, blob)
      updateField("avatarUrl", publicUrl)
      toast.success(t("messages.avatarUploadSuccess"))
      closeAvatarDialog()
    } catch (error) {
      console.error("Avatar upload failed", error)
      toast.error(
        error instanceof Error
          ? error.message
          : t("messages.avatarUploadError")
      )
    }
  }, [
    closeAvatarDialog,
    croppedAreaPixels,
    previewUrl,
    updateField,
    userId,
    t,
  ])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    const updates = {
      full_name: `${profile.firstName} ${profile.lastName}`.trim(),
      first_name: profile.firstName,
      last_name: profile.lastName,
      role: profile.role,
      phone: profile.phone,
      location: profile.location,
      bio: profile.bio,
      avatar_url: profile.avatarUrl,
    }

    const { error } = await supabase.auth.updateUser({
      data: updates,
      ...(profile.email && profile.email !== authEmail
        ? { email: profile.email }
        : {}),
    })

    if (error) {
      toast.error(error.message)
      setIsSaving(false)
      return
    }

    setAuthEmail(profile.email)
    toast.success(t("messages.profileUpdated"))
    setIsSaving(false)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    closeAvatarDialog()
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim()
  const initials =
    `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.trim()
  const summaryFields = [
    { label: t("emailAddress"), value: profile.email, icon: MailIcon },
    { label: t("phone"), value: profile.phone, icon: PhoneIcon },
    { label: t("location"), value: profile.location, icon: MapPinIcon },
    { label: t("role"), value: profile.role, icon: SparklesIcon },
  ].filter((field) => field.value.trim().length > 0)
  const aboutMessage = profile.bio.trim() || t("noBio")

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? t("editProfile") : t("title")}
        description={
          isEditing ? t("editDescription") : t("description")
        }
        action={
          isEditing ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                {t("cancelButton")}
              </Button>
              <Button type="submit" form="profile-form" disabled={isSaving}>
                {isSaving ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <ShieldCheckIcon data-icon="inline-start" />
                )}
                {t("saveButton")}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditing(true)}
            >
              <PencilIcon data-icon="inline-start" />
              {t("editButton")}
            </Button>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{t("profileSummary")}</CardTitle>
            <CardDescription>
              {t("summaryDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <button
                  aria-label={
                    isEditing ? t("changePhoto") : t("title")
                  }
                  className={cn(
                    "relative rounded-full transition",
                    isEditing
                      ? "cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      : "cursor-default"
                  )}
                  data-dragging={isAvatarDragging || undefined}
                  disabled={!isEditing}
                  onClick={isEditing ? openFileDialog : undefined}
                  onDragEnter={isEditing ? handleDragEnter : undefined}
                  onDragLeave={isEditing ? handleDragLeave : undefined}
                  onDragOver={isEditing ? handleDragOver : undefined}
                  onDrop={isEditing ? handleDrop : undefined}
                  type="button"
                >
                  <Avatar className="size-20 data-[dragging=true]:bg-accent/50">
                    {profile.avatarUrl ? (
                      <AvatarImage
                        alt={`${fullName || t("unknownUser")} profile picture`}
                        src={profile.avatarUrl}
                      />
                    ) : null}
                    <AvatarFallback>{initials || "U"}</AvatarFallback>
                  </Avatar>
                  {isEditing ? (
                    <span className="pointer-events-none absolute end-0 bottom-0 inline-flex size-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
                      <CameraIcon className="size-4" />
                    </span>
                  ) : null}
                </button>
 
                <input
                  {...getInputProps({ disabled: !isEditing })}
                  aria-label="Upload profile picture"
                  className="sr-only"
                  tabIndex={-1}
                />
              </div>

              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button onClick={openFileDialog} size="sm" type="button">
                    <CameraIcon data-icon="inline-start" />
                    {t("changePhoto")}
                  </Button>
                  {profile.avatarUrl ? (
                    <Button
                      onClick={() => updateField("avatarUrl", "")}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      <XIcon data-icon="inline-start" />
                      {t("removePhoto")}
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <div className="min-w-0">
                <p className="text-lg leading-none font-semibold">
                  {fullName || t("unknownUser")}
                </p>
                {profile.role ? (
                  <p className="text-sm text-muted-foreground">
                    {profile.role}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              {summaryFields.length > 0 ? (
                summaryFields.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center justify-center gap-2"
                  >
                    <Icon className="size-4" />
                    <span>{value}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  {t("noSummaryData")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>{isEditing ? t("personalDetails") : t("about")}</CardTitle>
            <CardDescription>
              {isEditing
                ? t("detailsDescription")
                : t("aboutDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <form
                id="profile-form"
                className="space-y-6"
                onSubmit={handleSubmit}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="first-name">{t("firstName")}</FieldLabel>
                    <FieldContent>
                      <Input
                        id="first-name"
                        value={profile.firstName}
                        onChange={(event) =>
                          updateField("firstName", event.target.value)
                        }
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="last-name">{t("lastName")}</FieldLabel>
                    <FieldContent>
                      <Input
                        id="last-name"
                        value={profile.lastName}
                        onChange={(event) =>
                          updateField("lastName", event.target.value)
                        }
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="email">{t("emailAddress")}</FieldLabel>
                    <FieldContent>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                      />
                    </FieldContent>
                    <FieldDescription>
                      {t("emailDescription")}
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="phone">{t("phone")}</FieldLabel>
                    <FieldContent>
                      <PhoneInput
                        id="phone"
                        defaultCountry="SA"
                        international
                        placeholder={t("phonePlaceholder")}
                        value={profile.phone}
                        onChange={(value) => updateField("phone", value || "")}
                      />
                    </FieldContent>
                    <FieldDescription>
                      {t("phoneDescription")}
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="location">{t("location")}</FieldLabel>
                    <FieldContent>
                      <Input
                        id="location"
                        value={profile.location}
                        onChange={(event) =>
                          updateField("location", event.target.value)
                        }
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="bio">{t("bio")}</FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="bio"
                        value={profile.bio}
                        onChange={(event) =>
                          updateField("bio", event.target.value)
                        }
                        rows={4}
                      />
                    </FieldContent>
                    <FieldDescription>
                      {t("bioDescription")}
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("firstName")} {t("lastName")}</p>
                  <p>{fullName || t("unknownUser")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("bio")}</p>
                  <p>{aboutMessage}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog onOpenChange={setIsAvatarDialogOpen} open={isAvatarDialogOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-140 *:[button]:hidden">
          <DialogDescription className="sr-only">
            {t("cropDescription")}
          </DialogDescription>
          <DialogHeader className="contents space-y-0 text-start">
            <DialogTitle className="flex items-center justify-between border-b p-4 text-base">
              <div className="flex items-center gap-2">
                <Button
                  aria-label={t("cancelButton")}
                  className="-my-1 opacity-60"
                  onClick={closeAvatarDialog}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ArrowLeftIcon />
                </Button>
                <span>{t("cropTitle")}</span>
              </div>
              <Button
                className="-my-1"
                disabled={!previewUrl}
                onClick={handleApplyAvatar}
                type="button"
              >
                {t("apply")}
              </Button>
            </DialogTitle>
          </DialogHeader>

          {previewUrl ? (
            <Cropper
              className="h-96 sm:h-120"
              image={previewUrl}
              onCropChange={handleAvatarCropChange}
              onZoomChange={setZoom}
              zoom={zoom}
            >
              <CropperDescription />
              <CropperImage />
              <CropperCropArea />
            </Cropper>
          ) : null}

          <DialogFooter className="border-t px-4 py-6">
            <div className="mx-auto flex w-full max-w-80 items-center gap-4">
              <ZoomOutIcon
                aria-hidden="true"
                className="shrink-0 opacity-60"
                size={16}
              />
              <Slider
                aria-label={t("zoom")}
                max={3}
                min={1}
                onValueChange={(value) => setZoom(value[0] ?? 1)}
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
    </div>
  )
}
