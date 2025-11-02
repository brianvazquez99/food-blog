import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from "@angular/router";
import { RECIPE } from '../../types';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  http = inject(HttpClient)

  posts = signal<RECIPE[] | undefined>(undefined)


  ngOnInit(): void {

    const params = new HttpParams().set("recent", 1);
      this.http.get<RECIPE[]>("/api/getBlogs", {params: params}).subscribe( {
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
