import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RECIPE } from '../../types';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-recipes',
  imports: [RouterLink],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Recipes implements OnInit {

  http = inject(HttpClient)

  posts = signal<RECIPE[] | undefined>(undefined)

    ngOnInit(): void {
      this.http.get<RECIPE[]>("/api/getBlogs").subscribe( {
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
