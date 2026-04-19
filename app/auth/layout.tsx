import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-3 self-center font-medium">
          <div className="relative h-10 w-40">
            <Image
              src="/brand/logo-light.png"
              alt="Super Office"
              fill
              priority
              className="object-contain dark:hidden"
            />
            <Image
              src="/brand/logo-dark.png"
              alt="Super Office"
              fill
              priority
              className="hidden object-contain dark:block"
            />
          </div>
        </a>
        {children}
      </div>
    </div>
  )
}
