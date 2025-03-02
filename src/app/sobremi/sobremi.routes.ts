import { Routes } from "@angular/router";

export default [
    {
        path:'',
        loadComponent: () => import('./sobremi.component').then(
            (m) => m.SobremiComponent
        )
    }
] as Routes