import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      expand={true}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "bg-white border-neutral-200 shadow-elevation-2 rounded-lg",
          title: "text-neutral-900 font-semibold",
          description: "text-neutral-600",
          actionButton: "bg-macon-orange text-white hover:bg-macon-orange-dark",
          cancelButton: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
          closeButton: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200",
          success: "border-success-200 bg-success-50",
          error: "border-danger-200 bg-danger-50",
          warning: "border-warning-200 bg-warning-50",
          info: "border-macon-teal bg-macon-teal/10",
        },
      }}
    />
  )
}
