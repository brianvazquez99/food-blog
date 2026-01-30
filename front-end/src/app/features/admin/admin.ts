import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { BlogService } from '../../blog-service';
import { RECIPE } from '../../types';

import { DomSanitizer } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';

type INGREDIENT = {
  NAME: string | null;
  AMOUNT: string | null;
  UNIT: string | null;
};

type INGREDIENT_LIST = {
  HEADER:string
  INGREDIENTS: INGREDIENT[]
  ORDER:number
}
type INSTRUCTION = {
  ORDER: number;
  CONTENT: string;
};

@Component({
  selector: 'app-admin',
  imports: [QuillModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:beforeunload)': 'unloadNotification($event)',
    '(click)': 'closeCat'
  }
})
export class Admin implements OnInit  {
  destroy = inject(DestroyRef);

  post = signal<
    RECIPE & { SERVINGS: number | null; PREP_TIME: string | null; COOK_TIME: string | null }
  >({
    ID: null,
    TITLE: '',
    BODY: '',
    THUMBNAIL: new Blob(),
    DATE_ADDED: '',
    CATEGORY: [],
    SERVINGS: null,
    PREP_TIME: null,
    COOK_TIME: null,
  });

  showToast = signal<boolean>(false);
  thumbnail!: File;

  imgSrc = signal<any>(null);

  previewOn = signal<boolean>(false);

  http = inject(HttpClient);

  router = inject(Router);

  blogService = inject(BlogService);

  selectedCategories = signal<string[]>([]);

  showCategories = signal<boolean>(false);

  quillConfig = {
    //toolbar: '.toolbar',
    toolbar: {
      container: [
        ['italic', 'underline', 'strike'], // toggled buttons
        ['code-block'],
        [{ header: 1 }, { header: 2 }], // custom button values
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
        [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
        [{ direction: 'rtl' }], // text direction

        [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
        [{ header: [1, 2, 3, 4, 5, 6, false] }],

        [{ font: [] }],
        [{ align: [] }],

        ['clean'], // remove formatting button

        ['link'],
        ['BTN'],
        ['image', 'video'],
      ],

    },
  };

  addCat = viewChild<ElementRef<HTMLDialogElement>>('addCat');
  editor = viewChild<ElementRef<QuillEditorComponent>>('editor');
  loading = signal<boolean>(false);

  isSaved:boolean = false


  sanitizer = inject(DomSanitizer);

  quill: any;

  newCat = signal<string | undefined>(undefined);
  newInstruction = signal<string | undefined>(undefined);

  newIngredient = signal<INGREDIENT>({
    NAME: null,
    AMOUNT: null,
    UNIT: null,
  });

  ingredients = signal<INGREDIENT_LIST[]>([]);
  instructions = signal<INSTRUCTION[]>([]);

  saving = signal<boolean>(false);

  categories = signal<string[]>([])

  categoriesSignal = toSignal(this.blogService.getCategories().pipe(catchError(err =>{
    console.error(err)
    return of([])
  }),
tap(val => {if (val) {

  this.categories.set(val)
}
})), {initialValue: []})


ngOnInit(): void {
  const blog = localStorage.getItem('blog_post')
  const instructions = localStorage.getItem('blog_instructions')
  const ingredients = localStorage.getItem('blog_ingredients')
  if(blog) {
    this.post().BODY = blog
    this.post.set({...this.post()})
  }
  if(instructions) {
    this.instructions.set(JSON.parse(instructions))
  }
  if(ingredients) {
    this.ingredients.set(JSON.parse(ingredients))
  }
}


unloadNotification($event: BeforeUnloadEvent) {
    if (!this.isSaved) {
      // Modern browsers require these two lines to trigger the native popup
      $event.preventDefault();
      $event.returnValue = true;
    }
  }

  closeCat() {
      if (this.showCategories()) {
        this.showCategories.set(false);
      }
      if (this.addCat() && this.addCat()?.nativeElement.open) {
        this.addCat()?.nativeElement.close();
      }
  }

  addCategory() {
    if(!this.newCat()) return
      this.categories().push(this.newCat()!);
      this.categories.set([...this.categories()])
      this.selectedCategories.set([...this.selectedCategories(), this.newCat()!]);
      this.addCat()?.nativeElement.close();
      this.newCat.set('');
  }

  addHeader(event:string) {
    this.ingredients.set([...this.ingredients(), {HEADER: event, INGREDIENTS:[], ORDER: this.ingredients().length}])
    console.log(event)
  }

  removeHeader(index:number) {

    const header = this.ingredients()[index]
    if (header) {
      const okToDelete =confirm('Deleting The header will delete the subitems, are you sure you want to delete it?')
      if(okToDelete) {
        this.ingredients().splice(index, 1)
        this.ingredients().forEach((el, i) => {
          el.ORDER = i + 1
        })
        this.ingredients.set([...this.ingredients()])
      }
    }

  }


  addIngredient(index:number) {
    if (
      this.newIngredient().AMOUNT == null ||
      this.newIngredient().NAME == null ||
      this.newIngredient().UNIT == null
    ) {
      console.log(this.newIngredient());
      return;
    }
    const ingredients = this.ingredients()[index]
    ingredients.INGREDIENTS.push(this.newIngredient())
    this.ingredients()[index] = ingredients
    this.ingredients.set([...this.ingredients()]);
    localStorage.setItem('blog_ingredients', JSON.stringify(this.ingredients()))
    this.newIngredient.set({
      NAME: null,
      AMOUNT: null,
      UNIT: null,
    });
  }

  removeIngredient(parentIndex: number, listIndex:number) {
    const ingredients = this.ingredients()[parentIndex];
    ingredients.INGREDIENTS.splice(listIndex, 1);
    this.ingredients()[parentIndex] = ingredients
    this.ingredients.set([...this.ingredients()]);
    localStorage.setItem('blog_ingredients', JSON.stringify(this.ingredients()))
  }

  addInstruction() {
    if (!this.newInstruction()) return;

    console.log(JSON.stringify( this.newInstruction()))
    const instructions = this.newInstruction()?.split(/\r\n|\r|\n/)
    console.log(instructions)
    let newInstructions:INSTRUCTION[] = []

    if (!instructions) return

    instructions?.forEach((element, index) => {
      const instruction: INSTRUCTION = {
        ORDER: this.instructions().length + (index + 1),
        CONTENT: element!,
      };

      newInstructions.push(instruction)

    })


    this.instructions.set([...this.instructions(), ...newInstructions]);
    localStorage.setItem('blog_instructions', JSON.stringify(this.instructions()))

    this.newInstruction.set(undefined);
  }

  removeInstruction(index: number) {
    const instructions = this.instructions();
    instructions.splice(index, 1);
    for (let index = 0; index < instructions.length; index++) {
      const element = instructions[index];
      element.ORDER = index + 1;
    }
    console.log(instructions);
    this.instructions.set([...instructions]);
     localStorage.setItem('blog_instructions', JSON.stringify(this.instructions()))

  }

  saveBody(event:any) {

    console.log(event)
    localStorage.setItem('blog_post', event)

  }


  onEditorCreated(quill: any) {
    this.quill = quill;
  }

  updateCategories(cat: string) {
    console.log(this.selectedCategories());

    let categories = this.selectedCategories();

    if (categories.includes(cat)) {
      categories.splice(categories.indexOf(cat), 1);
    } else {
      categories.push(cat);
    }

    this.selectedCategories.set([...categories]);
    console.log(this.selectedCategories());
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;

    this.thumbnail = input.files![0];

    if (this.thumbnail) {
      const blobUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(this.thumbnail));

      this.imgSrc.set(blobUrl);
    }
  }

  onSave() {
    if (this.loading()) return;

    if (this.selectedCategories().length == 0) {
      alert('Please Enter at least on Category');
      return;
    }
    if (this.post().TITLE == null || this.post().BODY == null || this.thumbnail == null) {
      alert('Not all content has been filled!');
      this.saving.set(false);

      return;
    }

    const formData = new FormData();
    formData.append('TITLE', this.post().TITLE!);
    formData.append('BODY', this.post().BODY!);
    formData.append('SERVINGS', String(this.post().SERVINGS!));
    formData.append('PREP_TIME', String(this.post().PREP_TIME!));
    formData.append('COOK_TIME', String(this.post().COOK_TIME!));
    formData.append('THUMBNAIL', this.thumbnail);
    formData.append('CATEGORY', this.selectedCategories().join());
    formData.append('INGREDIENTS', JSON.stringify(this.ingredients()));
    formData.append('INSTRUCTIONS', JSON.stringify(this.instructions()));
    formData.append('SLUG',  this.blogService.getSlug(this.post().TITLE!));
    this.loading.set(true);
    this.http.post('/api/postBlog', formData).subscribe({
      next: (value) => {
        this.isSaved = true
        localStorage.removeItem('blog_post')
        localStorage.removeItem('blog_ingredients')
        localStorage.removeItem('blog_instructions')
        this.showToast.set(true);
        this.loading.set(false);
          window.location.assign(
            'https://mailanhomebakery.com/blogDetails/' +
              this.blogService.getSlug(this.post().TITLE!)
          )

      },
      error: (err) => {
        console.log(err);
        this.loading.set(false);
      },
    });
  }

  openAddCat() {
    this.addCat()?.nativeElement.showModal();
  }
}
