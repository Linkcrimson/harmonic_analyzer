import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Toast } from './Toast'

export const UpdateManager = () => {
    // interval in milliseconds to check for updates (e.g., every hour)
    const intervalMS = 60 * 60 * 1000
    const [status, setStatus] = useState<string | null>(null)
    const [needRefresh, setNeedRefresh] = useState(false)

    const { updateServiceWorker: swUpdate } = useRegisterSW({
        onRegistered(r) {
            if (r) {
                // Check every hour
                setInterval(() => {
                    r.update()
                }, intervalMS)

                // Check on visibility change
                const handleVisibilityChange = () => {
                    if (document.visibilityState === 'visible') {
                        r.update()
                    }
                }
                document.addEventListener('visibilitychange', handleVisibilityChange)
            }
        },
        onRegisterError(error) {
            console.error('SW registration error', error)
        },
        onNeedRefresh() {
            setNeedRefresh(true)
            setStatus("Nuova versione disponibile!")
        },
        onOfflineReady() {
            setStatus("App pronta per l'uso offline")
            setTimeout(() => setStatus(null), 3000)
        }
    })

    const handleUpdate = () => {
        swUpdate(true)
    }

    return (
        <Toast
            message={status || ""}
            visible={!!status}
            action={needRefresh ? { label: "Aggiorna", onClick: handleUpdate } : undefined}
        />
    )
}
