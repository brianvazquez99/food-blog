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
import { RecipeDetails } from '../recipes/recipe-details/recipe-details';
import {toSignal} from '@angular/core/rxjs-interop'

import './quill-recipe-blot';
import { catchError, of } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-admin',
  imports: [QuillModule, FormsModule, RecipeDetails],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements OnInit {
  destroy = inject(DestroyRef);

  post = signal<RECIPE>({
    ID: null,
    TITLE: '',
    BODY: '',
    THUMBNAIL: new Blob(),
    DATE_ADDED: '',
    CATEGORY: [],
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

  addCat = viewChild<ElementRef<HTMLDialogElement>>('addCat')
  editor = viewChild<ElementRef<QuillEditorComponent>>('editor');

  // categories = toSignal(this.http.get<string[]>("/api/getCategories").pipe(
  //   catchError((err) => {
  //     console.error(err)
  //     return of([])
  //   })
  // ), {initialValue: []})

  categories = Array(5).fill("test")

  sanitizer = inject(DomSanitizer)

  quill: any;

  ngOnInit(): void {
    const closeCat = () => {
      if (this.showCategories()) {
        this.showCategories.set(false);
      }
      if(this.addCat() && this.addCat()?.nativeElement.open) {
        this.addCat()?.nativeElement.close()
      }
    };
    document.addEventListener('click', closeCat);

    this.destroy.onDestroy(() => {
      document.removeEventListener('click', closeCat);
    });
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

      const blobUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(this.thumbnail))

      this.imgSrc.set(blobUrl)
    }
  }

  onSave() {
    console.log(this.post().BODY);

    if (this.post().TITLE == null || this.post().BODY == null || this.post().THUMBNAIL == null) {
      alert('Not all content has been filled!');
      return;
    }

    const formData = new FormData();
    formData.append('TITLE', this.post().TITLE!);
    formData.append('BODY', this.post().BODY!);
    formData.append('THUMBNAIL', this.thumbnail);
    formData.append('CATEGORY', this.selectedCategories().join());

    this.http.post('/api/postBlog', formData).subscribe({
      next: (value) => {
        this.showToast.set(true);
        setTimeout(() => {
          this.router.navigate(['recipe', this.blogService.getSlug(this.post().TITLE!)]);
        }, 3000);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }


  openAddCat() {
    this.addCat()?.nativeElement.showModal()
  }
}
