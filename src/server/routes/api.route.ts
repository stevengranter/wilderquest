import {Router} from "express"
import {usersRouter} from "./users.route.js";
import {authRouter} from "./auth.route.js";
import {refreshTokenRouter} from "./refresh.route.js";

const router = Router()

// Route config
const routes = [
    // { url: "/", router: rootRouter },
    { url: "/users", router: usersRouter },
    { url: "/auth", router: authRouter },
    { url: "/refresh", router: refreshTokenRouter },
];

routes.forEach((route) => {
    router.use(route.url, route.router);
});

export {router as apiRouter}
