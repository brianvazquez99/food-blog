import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RECIPE } from './types';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  http = inject(HttpClient);

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
        const param = new HttpParams().set("ID", slug)
    return this.http.get("/api/getBlogDetails/"+ slug, {params: param, responseType: 'text'})
  }
}
