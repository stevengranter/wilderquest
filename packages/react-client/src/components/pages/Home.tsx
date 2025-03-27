import { Link } from "react-router";
import { useEffect } from "react";

export default function Home() {



  useEffect(()=>{
    fetch('/api/users',{
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + JSON.parse(localStorage.getItem("token") || "{}").accessToken
      }
  })
    .then(res => res.json())
    .then(data => console.log(data))
  return () => {}
  },[])
  return (
    <>
      <h2>Howdy ho!</h2>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>

    </>
  );
}
