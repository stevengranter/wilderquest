import UserContext from '@/contexts/UserContext.ts'
import { useContext } from 'react'


const useAuth = () => useContext(UserContext);

export default useAuth
