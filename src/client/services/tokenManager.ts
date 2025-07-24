import { useLocalStorage } from '@uidotdev/usehooks'
import { LoggedInUser } from '../../shared/types/authTypes'

export default function useTokenManager() {
    const [accessToken, saveAccessToken] = useLocalStorage<string>(
        'accessToken',
        ''
    )
    const [refreshToken, saveRefreshToken] = useLocalStorage<string>(
        'refreshToken',
        ''
    )
    const [user, saveUser] = useLocalStorage<LoggedInUser | null>('user', null)

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
