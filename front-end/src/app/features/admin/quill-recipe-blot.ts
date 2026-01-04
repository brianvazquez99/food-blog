import Quill, { Module } from 'quill';

const BlockEmbed = Quill.import('blots/block/embed') as any;

export class RecipeBlot extends BlockEmbed {
    static blotName = 'recipe';
  static tagName = 'div';

  static create(value?: string) {
    const node = super.create();
    node.setAttribute('id', 'recipe');

    console.log(value)
    if (value) node.innerHTML = value
    return node;
  }
}

Quill.register(RecipeBlot);
