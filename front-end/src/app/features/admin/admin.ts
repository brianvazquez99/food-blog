import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
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

  http = inject(HttpClient)

  onSave() {
    console.log("title", this.title())
    console.log("body", this.body())
    if (this.title() == null || this.body() == null) {
      alert("Please Enter a" + this.title() ? "Title" : "Content")
      return
    }
    this.http.post("/api/postBlog", {title: this.title(), body: this.body()}).subscribe( {
      next: value => {
        console.log(value)
      },
      error: err => {
        console.log(err)
      }
    })
  }

}
