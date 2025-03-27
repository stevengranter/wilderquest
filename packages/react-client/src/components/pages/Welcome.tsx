import useAuth from "@/hooks/useAuth.tsx";
import { jwtDecode } from "jwt-decode";
import { Button } from '@/components/ui/button.tsx'


const Welcome = () => {
  const {token, refreshAccessToken} = useAuth()
  const user = localStorage.getItem("user")

  return (
    <>
    <h1>Welcome {user}!</h1>
    <p>This page is for logged in users only, you must have a valid access token</p>
      {token && `Token is ${token}`}
      <div>Token Expire time:
      {token ? jwtDecode(token).exp : ""}
      </div>
      <Button onClick={refreshAccessToken}>Refresh Access Token</Button>
  </>
  )
}

export default Welcome
