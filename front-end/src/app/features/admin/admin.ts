import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { RECIPE } from '../../types';
import { RecipeDetails } from '../recipes/recipe-details/recipe-details';

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

  thumbnail!: File;

  imgSrc = signal<any>(null)

    test = effect(() => {
    console.log(this.post().BODY)
  })

  previewOn = signal<boolean>(false)

  http = inject(HttpClient)

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement

    this.thumbnail = input.files![0]

    if (this.thumbnail) {
     const reader = new FileReader()

     reader.readAsDataURL(this.thumbnail)

     reader.onload = () => {
      this.imgSrc.set(reader.result)
     }

    }

  }


  onSave() {

    console.log(this.post().BODY)

    if (this.post().TITLE == null || this.post().BODY == null || this.post().THUMBNAIL == null) {
      alert("Not all content has been filled!")
      return
    }

    const formData = new FormData()
    formData.append('TITLE', this.post().TITLE!)
    formData.append('BODY', this.post().BODY!)
    formData.append('THUMBNAIL', this.thumbnail)
    this.http.post("/api/postBlog", formData).subscribe( {
      next: value => {
        console.log(value)
      },
      error: err => {
        console.log(err)
      }
    })
  }

}
