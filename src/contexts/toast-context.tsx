"use client"

import { createContext, useContext, ReactNode } from "react"
import toast, { ToastOptions } from "react-hot-toast"

interface ToastContextType {
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
  warning: (message: string, options?: ToastOptions) => void
  loading: (message: string, options?: ToastOptions) => void
  dismiss: (id?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const contextValue: ToastContextType = {
    success: (message: string, options?: ToastOptions) => toast.success(message, {
      position: "top-right",
      duration: 4000,
      ...options,
    }),
    error: (message: string, options?: ToastOptions) => toast.error(message, {
      position: "top-right",
      duration: 5000,
      ...options,
    }),
    info: (message: string, options?: ToastOptions) => toast(message, {
      position: "top-right",
      duration: 3000,
      ...options,
    }),
    warning: (message: string, options?: ToastOptions) => toast(message, {
      position: "top-right",
      duration: 4000,
      ...options,
    }),
    loading: (message: string, options?: ToastOptions) => toast.loading(message, {
      position: "top-right",
      duration: 0,
      ...options,
    }),
    dismiss: (id?: string) => toast.dismiss(id),
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
