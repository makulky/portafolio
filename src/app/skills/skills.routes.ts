import { Routes } from "@angular/router";

export default [
    {
        path:'',
        loadComponent: () => import('./skills.component').then(
            (m) => m.SkillsComponent
        )
    }
] as Routes