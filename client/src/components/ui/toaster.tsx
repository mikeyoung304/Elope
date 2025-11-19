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
          toast: "bg-white border-gray-200 shadow-elevation-2 rounded-lg",
          title: "text-gray-900 font-semibold",
          description: "text-gray-600",
          actionButton: "bg-macon-orange text-white hover:bg-macon-orange-dark",
          cancelButton: "bg-gray-100 text-gray-700 hover:bg-gray-200",
          closeButton: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200",
          success: "border-green-200 bg-green-50",
          error: "border-red-200 bg-red-50",
          warning: "border-yellow-200 bg-yellow-50",
          info: "border-macon-teal bg-macon-teal/10",
        },
      }}
    />
  )
}
