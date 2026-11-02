import { ref, readonly } from 'vue'

export interface DialogOptions {
  title: string
  message?: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
  type?: 'confirm' | 'prompt'
  danger?: boolean
  inputType?: string
  min?: number
  max?: number
}

interface DialogState extends DialogOptions {
  id: string
  resolve: (value: any) => void
  inputValue: string
}

const currentDialog = ref<DialogState | null>(null)

export function useDialog() {
  function open(options: DialogOptions): Promise<any> {
    return new Promise((resolve) => {
      currentDialog.value = {
        ...options,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resolve,
        inputValue: options.defaultValue ?? '',
      }
    })
  }

  function confirm(options: Omit<DialogOptions, 'type'>): Promise<boolean> {
    return open({
      ...options,
      type: 'confirm',
      confirmText: options.confirmText ?? 'Confirm',
      cancelText: options.cancelText ?? 'Cancel',
    }).then(res => Boolean(res))
  }

  function prompt(options: Omit<DialogOptions, 'type'>): Promise<string | null> {
    return open({
      ...options,
      type: 'prompt',
      confirmText: options.confirmText ?? 'Submit',
      cancelText: options.cancelText ?? 'Cancel',
    }).then(res => (typeof res === 'string' ? res : null))
  }

  function close(value: any) {
    if (!currentDialog.value) return
    const resolve = currentDialog.value.resolve
    currentDialog.value = null
    resolve(value)
  }

  return {
    current: readonly(currentDialog),
    confirm,
    prompt,
    close,
  }
}
