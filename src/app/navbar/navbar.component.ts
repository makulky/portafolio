import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SkillsComponent } from '../skills/skills.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  menuOpen: boolean = false;
  activeSection: string = ''; // Almacena la sección activa

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
  activeMenu: string = '';
  
 // Almacena el enlace activo

  setActive(menuItem: string, section:string) {
    this.activeSection = section; // Cambia el estado de la sección activa
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
    this.activeMenu = menuItem; // Cambia el estado del menú activo
  }
}
