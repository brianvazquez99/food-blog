import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { RecipeDetails } from '../recipes/recipe-details/recipe-details';
import { RECIPE } from '../../types';
import { DomSanitizer } from '@angular/platform-browser';
import { sign } from 'crypto';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-admin',
  imports: [QuillModule, FormsModule, RecipeDetails, NgOptimizedImage],
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
    // this.http.post("/api/postBlog", this.post()).subscribe( {
    //   next: value => {
    //     console.log(value)
    //   },
    //   error: err => {
    //     console.log(err)
    //   }
    // })
  }

}
