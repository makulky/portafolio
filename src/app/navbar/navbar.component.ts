import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastComponent } from "../toast/toast.component";
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  menuOpen: boolean = false; // Controla el estado del menú colapsable
  activeMenu: string = ''; // Almacena el enlace activo
  showToast = false;

  // Alterna la visibilidad del menú
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // Establece el enlace activo y realiza el desplazamiento
  setActive(menuItem: string) {
    document.getElementById(menuItem)?.scrollIntoView({ behavior: 'smooth' });
    this.menuOpen = false; // Cierra el menú en dispositivos móviles al seleccionar un enlace
  }

  setToast(toast: string){
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
