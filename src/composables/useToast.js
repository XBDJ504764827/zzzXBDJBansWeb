import { ref, h, render } from 'vue'
import Toast from '@/components/Toast.vue'

const toasts = ref([])
let container = null

const createContainer = () => {
    if (!container && typeof document !== 'undefined') {
        container = document.createElement('div')
        container.className = 'fixed top-4 right-4 z-[9999] flex flex-col items-end pointer-events-none'
        document.body.appendChild(container)
    }
}

const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
        toasts.value.splice(index, 1)
        renderToasts()
    }
}

const renderToasts = () => {
    if (!container) createContainer()

    // Clear container
    render(null, container)

    // Re-render all toasts
    // Note: This is a simplified way. Ideally we mount strictly controlled components.
    // For Vue 3, using a vnode array rendering into container is tricky without a parent component.
    // A better approach in Vue 3 is to have a global <ToastContainer /> in App.vue. 
    // But to keep it usable as a composable without modifying App.vue heavily, 
    // we can use a Teleport or manage a reactive array that a global component reads.
}

// Let's switch to a Global Component approach which is cleaner for Vue 3
// We will create the state here, and App.vue or a generic GlobalToast component receives it.

// Revised Plan:
// 1. Export state `globalToasts`
// 2. Export `addToast` function
// 3. Create a `ToastContainer.vue` that iterates `globalToasts`

const globalToasts = ref([])
let idCounter = 0

const add = (options) => {
    const id = String(idCounter++)
    const toast = {
        id,
        ...options
    }
    globalToasts.value.push(toast)

    if (options.duration !== 0) {
        setTimeout(() => {
            remove(id)
        }, options.duration || 3000)
    }
}

const remove = (id) => {
    const index = globalToasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
        globalToasts.value.splice(index, 1)
    }
}

export function useToast() {
    return {
        toasts: globalToasts,
        add,
        remove,
        success: (message, title = 'Success') => add({ title, message, type: 'success' }),
        error: (message, title = 'Error') => add({ title, message, type: 'error' }),
        info: (message, title = 'Info') => add({ title, message, type: 'info' }),
        warning: (message, title = 'Warning') => add({ title, message, type: 'warning' })
    }
}
