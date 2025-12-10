import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Toast } from './Toast'

export const UpdateManager = () => {
    // interval in milliseconds to check for updates (e.g., every hour)
    const intervalMS = 60 * 60 * 1000
    const [status, setStatus] = useState<string | null>(null)

    useEffect(() => {
        // Show initial checking message
        setStatus("Checking for updates...")
        const timer = setTimeout(() => {
            setStatus(null)
        }, 3000)
        return () => clearTimeout(timer)
    }, [])

    useRegisterSW({
        onRegistered(r) {
            if (r) {
                // Check every hour
                setInterval(() => {
                    r.update()
                }, intervalMS)

                // Check on visibility change (e.g. key to the user's request: "all'apertura")
                // When app comes to foreground from background on mobile
                const handleVisibilityChange = () => {
                    if (document.visibilityState === 'visible') {
                        setStatus("Checking for updates...")
                        r.update().then(() => {
                            // Clear toast after a short delay if no update found
                            // If update found, onNeedRefresh/onOfflineReady handles it usually, 
                            // but for now we just show we checked.
                            setTimeout(() => setStatus(null), 2000)
                        })
                    }
                }

                document.addEventListener('visibilitychange', handleVisibilityChange)
            }
        },
        onRegisterError(error) {
            console.error('SW registration error', error)
        }
    })

    return <Toast message={status || ""} visible={!!status} />
}
