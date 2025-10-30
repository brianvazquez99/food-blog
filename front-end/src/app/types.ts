import { SafeHtml } from "@angular/platform-browser"

export type RECIPE = {
  ID: number | null,
  TITLE: string | null,
  THUMBNAIL: Blob | null,
  BODY: string | null,
  DATE_ADDED: string | null
  SLUG?:string
}
