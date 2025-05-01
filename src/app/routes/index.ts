import express from 'express';
import { UserRoutes } from '../modules/routes/user.route';
import { AuthRoutes } from '../modules/routes/auth.route';
import { AdminRoutes } from '../modules/routes/admin.routes';


const router = express.Router();

const moduleRoutes = [
   
    {
        path: '/user',
        route: UserRoutes
    },
    {
        path: '/auth',
        route: AuthRoutes
    },
    {
        path: '/admin',
        route: AdminRoutes
    },
   
    
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;