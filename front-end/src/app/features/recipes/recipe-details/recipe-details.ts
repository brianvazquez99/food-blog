import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, effect, inject, input, model, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RECIPE } from '../../../types';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-recipe-details',
  imports: [],
  templateUrl: './recipe-details.html',
  styleUrl: './recipe-details.css'
})
export class RecipeDetails implements OnInit {


  http = inject(HttpClient)

  router = inject(ActivatedRoute)

  blogId = signal<number | undefined>(undefined)

  sanitizer = inject(DomSanitizer)




  previewRecipe = model<RECIPE | undefined>(undefined)

  // previewEffect = effect(() => {

  //   let body = this.previewRecipe()?.BODY!.replace(/<p>(?:\s|&nbsp;|<br>|<span><br><\/span>)*<\/p>/g, '<p>&nbsp;</p>')

  //   body?.replace(/<p>(?:\s|&nbsp;|<br>|<span><br><\/span>)*<\/p>/g, '<p>&nbsp;</p>')

  //   this.previewRecipe.set({...this.previewRecipe()!, BODY:body!})

  // })
  blog = signal<SafeHtml | undefined>(undefined)


  ngOnInit(): void {
    this.router.queryParamMap.subscribe({
      next:value => {
        const id = value.get("ID")
        if(id) {
          this.blogId.set(Number(id))
          this.getData()
        }
      }
    })

    if(this.previewRecipe()) {
         let body = this.previewRecipe()?.BODY!.replace(/<p>(?:\s|&nbsp;|<br>|<span><br><\/span>)*<\/p>/g, '<p>&nbsp;</p>')

    body?.replace(/<p>(?:\s|&nbsp;|<br>|<span><br><\/span>)*<\/p>/g, '<p>&nbsp;</p>')

    this.previewRecipe.set({...this.previewRecipe()!, BODY:body!})

    }


  }


  getData() {
    const param = new HttpParams().set("ID", this.blogId()!)
    this.http.get("/api/getBlogDetails", {params: param, responseType: 'text'}).subscribe({
      next:value => {
        console.log(value)
        this.blog.set( this.sanitizer.bypassSecurityTrustHtml(value.replace(/<p>(?:\s|&nbsp;|<br>|<span><br><\/span>)*<\/p>/g, '<p>&nbsp;</p>')))
      }
    })

  }



}
