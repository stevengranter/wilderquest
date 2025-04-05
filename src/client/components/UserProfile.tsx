import {UserData} from "../../types/types";
import {useEffect, useState} from "react";
import axios from "axios";
import {useParams} from "react-router";
import avatar from "animal-avatar-generator";
import {ReactSVG} from "react-svg";

export default function UserProfile() {
    const { id } = useParams();
    const [user, setUser] = useState<UserData | null>(null);

    useEffect(() => {
        axios.get(`/api/users/${id}`)
            .then((res)=> {
                setUser(res.data);
            })
    }, [id]);

    return (
        <>
        <h1>{user? user.username : "User Not Found"}</h1>
            {user && <ReactSVG src={`data:image/svg+xml;utf8,${encodeURIComponent(avatar(user.user_cuid, { size: 100 }))}`} />}
</>
    )
}



