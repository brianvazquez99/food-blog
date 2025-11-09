import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { RECIPE } from './types';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  http = inject(HttpClient);


  posts = signal<RECIPE[] | undefined>(undefined)

  getBlogList(recent: boolean = false): Observable<RECIPE[]> {
    switch (recent) {
      case true:
        const params = new HttpParams().set('recent', 1);
        return this.http.get<RECIPE[]>('/api/getBlogs', { params: params });
      case false:
        return this.http.get<RECIPE[]>('/api/getBlogs');
    }
  }


  getBlogDetails(slug:string): Observable<string> {
    return this.http.get("/api/getBlogDetails/"+ slug, {responseType: 'text'})
  }


  searchBlogs(search:string): Observable<any[]> {

            const params = new HttpParams().set('search', search);

    return this.http.get<any[]>("/api/searchBlogs", {params: params})
  }


      getSlug(title:string):string {

    const slug = title.replaceAll(" ", "-").toLowerCase();
    console.log(slug)
    return slug

  }
}
