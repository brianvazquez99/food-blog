import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-admin',
  imports: [QuillModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  standalone: true,
})
export class Admin {

  title = signal<string | undefined>(undefined)
  body = signal<string | undefined>(undefined)

  onSave() {
    console.log("title", this.title())
    console.log("body", this.body())
  }

}
