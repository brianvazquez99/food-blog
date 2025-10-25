import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { RecipeDetails } from '../recipes/recipe-details/recipe-details';
import { RECIPE } from '../../types';

@Component({
  selector: 'app-admin',
  imports: [QuillModule, FormsModule, RecipeDetails],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  standalone: true,
})
export class Admin {

  post = signal<RECIPE>({
    ID: null,
    TITLE: '',
    BODY: '',
    THUMBNAIL: new Blob(),
    DATE_ADDED: ''
  })

  previewOn = signal<boolean>(false)

  http = inject(HttpClient)

  onSave() {

    if (this.post().TITLE == null || this.post().BODY == null || this.post().THUMBNAIL == null) {
      alert("Not all content has been filled!")
      return
    }
    this.http.post("/api/postBlog", this.post()).subscribe( {
      next: value => {
        console.log(value)
      },
      error: err => {
        console.log(err)
      }
    })
  }

}
