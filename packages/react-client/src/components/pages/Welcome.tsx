import useAuth from "@/hooks/useAuth.tsx";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const Welcome = () => {
  const {token} = useAuth()
  const user = localStorage.getItem("user")

  useEffect(()=>{
    console.log(token)
    if (token) {
      const decodedToken = jwtDecode(JSON.stringify(token) || "");
      console.log(decodedToken)
      // const currentTime = Date.now() / 1000;



    }

  },[token])

  return (
    <>
    <h1>Welcome {user}!</h1>
    <p>This page is for logged in users only, you must have a valid access token</p>
      {token && `Token is ${token}`}
      <div>Token Expire time:
      {token ? jwtDecode(token).exp : ""}
      </div>

  </>
  )
}

export default Welcome
