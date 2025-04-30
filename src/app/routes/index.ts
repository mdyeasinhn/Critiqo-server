import express from 'express';
// import { AdminRoutes } from '../modules/routes/admin.routes';
import { UserRoutes } from '../modules/routes/user.route';


const router = express.Router();

const moduleRoutes = [
   
    {
        path: '/users',
        route: UserRoutes
    },
    // {
    //     path: '/admin',
    //     route: AdminRoutes
    // }
    
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;