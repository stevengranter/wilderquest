import {useAuth} from "@/hooks/useAuth.js";
import { jwtDecode } from "jwt-decode";
import { Button } from '@/components/ui/button.js'
import authService from "@/services/authService.js";
import {useEffect, useState} from "react";
import UserCollectionsView from "@/components/UserCollectionsView.js";
import UserProfile from "@/components/UserProfile.js";
import CollectionView from "@/components/CollectionView.js";


const Welcome = () => {
  const {refreshAccessToken} = authService
  const user = localStorage.getItem("user")
  const [token, setToken] = useState<string | null>(null)

  useEffect(()=>{
    const storedToken = localStorage.getItem("access_token")
    setToken(storedToken)
  })

  return (
    <>
    <h1>Welcome {user}!</h1>
    <p>This page is for logged in users only, you must have a valid access token</p>
      {token && `Token is ${token}`}
      <div>Token Expire time:
      {token ? jwtDecode(token).exp : ""}
      </div>
      <Button onClick={refreshAccessToken}>Refresh Access Token</Button>
      <UserCollectionsView userId={374} />
      <CollectionView collectionId={294} />
  </>
  )
}

export default Welcome
