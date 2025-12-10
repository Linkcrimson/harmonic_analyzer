import { useRegisterSW } from 'virtual:pwa-register/react'

export const UpdateManager = () => {
    // interval in milliseconds to check for updates (e.g., every hour)
    const intervalMS = 60 * 60 * 1000

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
                        r.update()
                    }
                }

                document.addEventListener('visibilitychange', handleVisibilityChange)
            }
        },
        onRegisterError(error) {
            console.error('SW registration error', error)
        }
    })

    return null
}
