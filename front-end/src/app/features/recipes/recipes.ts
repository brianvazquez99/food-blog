import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RECIPE } from '../../types';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs';

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
  postsCopy = signal<RECIPE[] | undefined>(undefined)
  loading = signal<boolean>(false)


  categoryFilter = signal<string[]>(['ALL'])

    ngOnInit(): void {
      this.loading.set(true)
      this.http.get<RECIPE[]>("/api/getBlogs").subscribe( {
        next: value => {
          console.log(value)
          this.posts.set(value.map((el) => { return {...el, SLUG: this.getSlug(el.TITLE!) }} ))
          this.postsCopy.set(structuredClone(this.posts()))
            this.loading.set(false)

        }
      })
  }


  updateFilter(category:string) {

    //update filters array first
    let filters = this.categoryFilter()

    if (filters.includes('ALL') && category != 'ALL') {
      filters.splice(filters.indexOf('ALL'), 1)

    }
    else if (category == 'ALL') {
      this.categoryFilter.set(['ALL'])
      this.postsCopy.set(structuredClone(this.posts()))
      return
    }
    if (filters.includes(category)) {
      filters.splice(filters.indexOf(category), 1)
    }
    else {
      filters.push(category)
    }


    let posts: RECIPE[] = []

    //begin filter

    for (let i = 0; i < filters.length; i++) {
      this.posts()!.forEach(element => {
        if (element.CATEGORY && element.CATEGORY.includes(filters[i].toUpperCase()) && !posts?.some(item => item.ID == element.ID)) {
          posts.push(element)
        }
      });
    }

    this.postsCopy.set(posts)

    console.log(this.postsCopy())


  }

  getSlug(title:string):string {

    const slug = title.replaceAll(" ", "-").toLowerCase();
    console.log(slug)
    return slug

  }

}
