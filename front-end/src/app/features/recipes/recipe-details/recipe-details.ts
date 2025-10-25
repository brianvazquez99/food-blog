import { Component, input, signal } from '@angular/core';
import { RECIPE } from '../../../types';

@Component({
  selector: 'app-recipe-details',
  imports: [],
  templateUrl: './recipe-details.html',
  styleUrl: './recipe-details.css'
})
export class RecipeDetails {

  recipe = input<RECIPE>({
    ID: 1,
    TITLE: 'Choco Cookies',
    THUMBNAIL: new Blob(),
    BODY:'<p>testing&nbsp;posting&nbsp;a&nbsp;blog</p>',
    DATE_ADDED: '2025-10-23'
  })



}
