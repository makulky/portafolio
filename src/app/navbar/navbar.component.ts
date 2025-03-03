import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  menuOpen: boolean = false; // Controla el estado del menú colapsable
  activeMenu: string = ''; // Almacena el enlace activo

  // Alterna la visibilidad del menú
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // Establece el enlace activo y realiza el desplazamiento
  setActive(menuItem: string) {
    this.activeMenu = menuItem; // Actualiza el menú activo
    document.getElementById(menuItem)?.scrollIntoView({ behavior: 'smooth' });
    this.menuOpen = false; // Cierra el menú en dispositivos móviles al seleccionar un enlace
  }
}
