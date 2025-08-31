import { LoggedInUser } from '../../shared/types/authTypes'
import { useSimpleLocalStorage } from '../hooks/useSimpleLocalStorage'

export default function useTokenManager() {
    const [accessToken, saveAccessToken] = useSimpleLocalStorage<string>(
        'accessToken',
        ''
    )
    const [refreshToken, saveRefreshToken] = useSimpleLocalStorage<string>(
        'refreshToken',
        ''
    )
    const [user, saveUser] = useSimpleLocalStorage<LoggedInUser | null>(
        'user',
        null
    )

    const clearAll = () => {
        saveAccessToken('')
        saveRefreshToken('')
        saveUser(null)
    }

    return {
        accessToken,
        saveAccessToken,
        refreshToken,
        saveRefreshToken,
        user,
        saveUser,
        clearAll,
    }
}
