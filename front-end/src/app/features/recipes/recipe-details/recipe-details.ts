import { HttpClient, HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, input, model, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RECIPE } from '../../../types';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlogService } from '../../../blog-service';

@Component({
  selector: 'app-recipe-details',
  imports: [],
  templateUrl: './recipe-details.html',
  styleUrl: './recipe-details.css',
    changeDetection:ChangeDetectionStrategy.OnPush

})
export class RecipeDetails implements OnInit {


  blogService = inject(BlogService)

  router = inject(ActivatedRoute)

  blogSlug = signal<string | undefined>(undefined)

  sanitizer = inject(DomSanitizer)




  previewRecipe = model<RECIPE | undefined>(undefined)


  blog = signal<SafeHtml | undefined>(undefined)



  ngOnInit(): void {
    this.router.paramMap.subscribe({
      next:param => {
        const slug = param.get("slug")
        if(slug) {
          this.blogSlug.set(slug)
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


  jumpToRecipe() {

    document.getElementById('recipe')?.scrollIntoView({
      behavior:'smooth'
    })
  }

  getData() {
    if (this.blogSlug()) {
    this.blogService.getBlogDetails(this.blogSlug()!).subscribe({
      next:value => {
        this.blog.set( this.sanitizer.bypassSecurityTrustHtml(value.replace(/<p>(?:\s|&nbsp;|<br>|<span><br><\/span>)*<\/p>/g, '<p>&nbsp;</p>')))
      }
    })
    }


  }



}
