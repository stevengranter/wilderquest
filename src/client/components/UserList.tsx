import { useEffect, useState } from 'react'
import axios from 'axios'
import { UserData } from '../../types/types.js'
import avatar from 'animal-avatar-generator'
import { ReactSVG } from 'react-svg'
import { Link } from 'react-router'
import { paths } from '@/routes/paths'

export default function UserList() {
    const [users, setUsers] = useState<UserData[]>([])

    useEffect(() => {
        axios
            .get('/api/users')
            .then((res) => {
                console.log(res)
                setUsers(res.data)
            })
            .catch((error) => {
                console.error('Error fetching users:', error)
            })
    }, [])

    return (
        <div>
            <h1>Users</h1>
            {users?.length > 0 ? (
                <div className="grid base:grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 content-center">
                    {users.map((user) => {
                        const userAvatar = avatar(user.user_cuid, {size: 100})
                        return (
                            <Link to={paths.userProfile(user.username)}>
                                <div
                                    className='flex flex-col p-5 border-1 items-center justify-center'
                                    key={user.id}
                                >
                                    {user.username}

                                    <ReactSVG
                                        src={`data:image/svg+xml;utf8,${encodeURIComponent(userAvatar)}`}
                                    />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <p>No users found.</p>
            )}
        </div>
    )
}
