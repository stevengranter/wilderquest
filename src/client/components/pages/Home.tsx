import { Link } from "react-router";
import { useEffect } from "react";

export default function Home() {

  return (
    <>
      <h2>Howdy ho!</h2>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>

    </>
  );
}
