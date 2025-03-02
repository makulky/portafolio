import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path:'sobremi',
        loadChildren: () => import('./sobremi/sobremi.routes')
    },
    {
        path:'skills',
        loadChildren: () => import('./skills/skills.routes')
    },
    {
        path:'contact',
        loadChildren: () => import('./contact/contact.routes')
    },
]
