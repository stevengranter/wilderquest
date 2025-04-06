import { jwtDecode } from "jwt-decode";
import { Button } from '@/components/ui/button.js'
import authService from "@/services/authService.js";
import {useEffect, useState} from "react";
import {Link} from "react-router";


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

      <Link to="/users">See all users</Link>
      <Button onClick={refreshAccessToken}>Refresh Access Token</Button>
  </>
  )
}

export default Welcome
