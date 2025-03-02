import { Routes } from "@angular/router";

export default [
    {
        path:'',
        loadComponent: () => import('./contact.component').then(
            (m) => m.ContactComponent
        )
    }
] as Routes