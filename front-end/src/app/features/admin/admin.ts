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
import './quill-recipe-blot';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';

type INGREDIENT = {
  NAME: string | null;
  AMOUNT: string | null;
  UNIT: string | null;
};
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
})
export class Admin implements OnInit {
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
      handlers: {
        BTN: () => {
          const range = this.quill.getSelection();

          if (!range) return;

          const lines = this.quill.getLines(range.index, range.length);

          console.log(lines);

          // Extract text or HTML per line
          const htmlLines = lines
            .map((line: any) => {
              const text = line.domNode.innerHTML; // preserves <br> and inline formatting
              return `<p>${text}</p>`;
            })
            .join('');

          console.log(htmlLines);

          // Delete the selected range
          this.quill.deleteText(range.index - 3, range.length + 3);

          this.quill.insertEmbed(range.index, 'recipe', htmlLines, 'user');
        },
      },
    },
  };

  addCat = viewChild<ElementRef<HTMLDialogElement>>('addCat');
  editor = viewChild<ElementRef<QuillEditorComponent>>('editor');
  loading = signal<boolean>(false);

  // categories = toSignal(this.http.get<string[]>("/api/getCategories").pipe(
  //   catchError((err) => {
  //     console.error(err)
  //     return of([])
  //   })
  // ), {initialValue: []})


  sanitizer = inject(DomSanitizer);

  quill: any;

  newCat = signal<string | undefined>(undefined);
  newInstruction = signal<string | undefined>(undefined);

  newIngredient = signal<INGREDIENT>({
    NAME: null,
    AMOUNT: null,
    UNIT: null,
  });

  ingredients = signal<INGREDIENT[]>([]);
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
    const closeCat = () => {
      if (this.showCategories()) {
        this.showCategories.set(false);
      }
      if (this.addCat() && this.addCat()?.nativeElement.open) {
        this.addCat()?.nativeElement.close();
      }
    };
    document.addEventListener('click', closeCat);

    this.destroy.onDestroy(() => {
      document.removeEventListener('click', closeCat);
    });
  }

  addCategory() {
    if(!this.newCat()) return
      this.categories().push(this.newCat()!);
      this.categories.set([...this.categories()])
      this.selectedCategories.set([...this.selectedCategories(), this.newCat()!]);
      this.addCat()?.nativeElement.close();
      this.newCat.set('');
  }

  addIngredient() {
    if (
      this.newIngredient().AMOUNT == null ||
      this.newIngredient().NAME == null ||
      this.newIngredient().UNIT == null
    ) {
      console.log(this.newIngredient());
      return;
    }
    this.ingredients.set([...this.ingredients(), this.newIngredient()]);
    this.newIngredient.set({
      NAME: null,
      AMOUNT: null,
      UNIT: null,
    });
  }

  removeIngredient(index: number) {
    const ingredients = this.ingredients();
    ingredients.splice(index, 1);
    this.ingredients.set([...ingredients]);
  }

  addInstruction() {
    if (!this.newInstruction()) return;

    const instruction: INSTRUCTION = {
      ORDER: this.instructions().length + 1,
      CONTENT: this.newInstruction()!,
    };

    this.instructions.set([...this.instructions(), instruction]);
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
  }

  // use this to change button title
  populateBtn(quill: any) {
    this.quill = quill;

    const recipeBtn = document.querySelector('.ql-BTN') as HTMLElement;
    console.log(recipeBtn);
    if (recipeBtn) {
      recipeBtn.innerHTML = 'Recipe';
      recipeBtn.style.width = 'auto'; // Prevent it from being a tiny square
      recipeBtn.style.padding = '0 8px';
      // Or use an icon: recipeBtn.innerHTML = '<i class="fa fa-utensils"></i>';
    }
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
    this.loading.set(true);
    this.http.post('/api/postBlog', formData).subscribe({
      next: (value) => {
        this.showToast.set(true);
        this.loading.set(false);
        setTimeout(() => {
          window.location.assign(
            'https://mailanhomebakery.com/getBlogDetails/' +
              this.blogService.getSlug(this.post().TITLE!)
          );
        }, 3000);
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
