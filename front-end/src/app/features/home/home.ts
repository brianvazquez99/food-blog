import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from "@angular/router";
import { RECIPE } from '../../types';
import { BlogService } from '../../blog-service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  blogService = inject(BlogService)

  posts = signal<RECIPE[] | undefined>(undefined)


  ngOnInit(): void {

    this.blogService.getBlogList(true).subscribe({
        next: value => {
          console.log(value)
          this.posts.set(value.map((el) => { return {...el, SLUG: this.getSlug(el.TITLE!)}} ))
        }
      })

  }

    getSlug(title:string):string {

    const slug = title.replaceAll(" ", "-").toLowerCase();
    console.log(slug)
    return slug

  }





}
