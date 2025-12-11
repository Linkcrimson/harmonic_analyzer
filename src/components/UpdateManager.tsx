import { usePWA } from '../context/PWAContext'
import { Toast } from './Toast'

export const UpdateManager = () => {
    const { needRefresh, updateServiceWorker, statusMessage } = usePWA();

    const handleUpdate = () => {
        updateServiceWorker(true)
    }

    return (
        <Toast
            message={statusMessage || ""}
            visible={!!statusMessage}
            action={needRefresh ? { label: "Aggiorna", onClick: handleUpdate } : undefined}
        />
    )
}
