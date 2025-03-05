import { Component, NgModule } from '@angular/core';
import { NavbarComponent } from "./navbar/navbar.component";
import { ContactComponent } from "./contact/contact.component";
import { SkillsComponent } from "./skills/skills.component";
import { FooterComponent } from "./footer/footer.component";
import { SobremiComponent } from "./sobremi/sobremi.component";
import { ProyectosComponent } from "./proyectos/proyectos.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, ContactComponent, SkillsComponent, FooterComponent, SobremiComponent, ProyectosComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'portafolio';
}
