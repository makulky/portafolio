import { Component, NgModule } from '@angular/core';
import { NavbarComponent } from "./navbar/navbar.component";
import { MainComponent } from "./main/main.component";
import { ContactComponent } from "./contact/contact.component";
import { SkillsComponent } from "./skills/skills.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, MainComponent, ContactComponent, SkillsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'portafolio';
}
