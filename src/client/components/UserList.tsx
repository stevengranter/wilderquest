import { useEffect, useState } from "react";
import axios from "axios";
import { UserData } from "../../types/types.js";
import avatar from "animal-avatar-generator";
import { ReactSVG } from 'react-svg';

export default function UserList() {
    const [users, setUsers] = useState<UserData[]>([]);

    useEffect(() => {
        axios
            .get("/api/users")
            .then((res) => {
                console.log(res);
                setUsers(res.data);
            })
            .catch((error) => {
                console.error("Error fetching users:", error);
            });
    }, []);

    return (
        <div>
            <h1>Users</h1>
            {users?.length > 0 ? (
                <ul>
                    {users.map((user) => {
                        const userAvatar = avatar(user.user_cuid, { size: 100 });
                        return (
                            <li key={user.id}>
                                {user.username}
                                <ReactSVG src={`data:image/svg+xml;utf8,${encodeURIComponent(userAvatar)}`} />
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p>No users found.</p>
            )}
        </div>
    );
}
