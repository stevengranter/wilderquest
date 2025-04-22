import {Link} from "react-router";
import {ThreeFiberCanvas} from "@/components/3d/ThreeFiberCanvas";

export default function Home() {

    return (
        <>
            <h2>Howdy ho!</h2>
            <Link to='/login'>Login</Link>
            <Link to='/register'>Register</Link>
            {/*<Link to='/camera'>Camera</Link>*/}
            <Link to='/search'>Search</Link>
            <ThreeFiberCanvas/>
        </>
    );
}
