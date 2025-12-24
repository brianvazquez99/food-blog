import { HttpClient, HttpParams } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from "@angular/router";
import { RECIPE } from '../../types';
import { BlogService } from '../../blog-service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
    changeDetection:ChangeDetectionStrategy.OnPush

})
export class Home implements OnInit {

  blogService = inject(BlogService)

  instgrm: any




  ngOnInit(): void {

    this.blogService.isLoading.set(true)
    this.blogService.getBlogList(true).subscribe({
        next: value => {
          this.blogService.isLoading.set(false)
          console.log(value)
          this.blogService.posts.set(value.map((el) => { return {...el, SLUG: this.blogService.getSlug(el.TITLE!)}} ))
        },
        error: value => {
          console.error(value)
          this.blogService.isLoading.set(false)
        }
      })

  }







}
