import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { BlogService } from '../../blog-service';
import { RECIPE } from '../../types';
import { RecipeDetails } from '../recipes/recipe-details/recipe-details';

@Component({
  selector: 'app-admin',
  imports: [QuillModule, FormsModule, RecipeDetails],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  standalone: true,
    changeDetection:ChangeDetectionStrategy.OnPush

})
export class Admin  {

  post = signal<RECIPE>({
    ID: null,
    TITLE: '',
    BODY: '',
    THUMBNAIL: new Blob(),
    DATE_ADDED: '',
    CATEGORY: []
  })


  showToast = signal<boolean>(false)
  thumbnail!: File;

  imgSrc = signal<any>(null)

    test = effect(() => {
    console.log(this.post().BODY)
  })

  previewOn = signal<boolean>(false)

  http = inject(HttpClient)

  router = inject(Router)

  blogService = inject(BlogService)

  selectedCategories = signal<string[] >([])

  showCategories = signal<boolean>(false)



  updateCategories(cat:string) {
    console.log(this.selectedCategories())

    let categories = this.selectedCategories()

    if(categories.includes(cat)) {

      categories.splice(categories.indexOf(cat), 1)

    }
    else {
      categories.push(cat)
    }

    this.selectedCategories.set([...categories])
    console.log(this.selectedCategories())

  }


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
    formData.append('CATEGORY', this.selectedCategories().join())

    this.http.post("/api/postBlog", formData).subscribe( {
      next: value => {
        this.showToast.set(true)
        this.router.navigate(['recipie', this.blogService.getSlug(this.post().TITLE!)])
      },
      error: err => {
        console.log(err)
      }
    })
  }

}
