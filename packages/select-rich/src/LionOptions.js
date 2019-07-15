import { LitElement } from '@lion/core';

/**
 * LionOptions
 *
 * @customElement
 * @extends LitElement
 */
export class LionOptions extends LitElement {
  static get properties() {
    return {
      role: {
        type: String,
        reflect: true,
      },
    };
  }

  constructor() {
    super();
    this.role = 'listbox';
    // TODO: make a real property?
    // eslint-disable-next-line wc/no-constructor-attributes
    this.tabIndex = 0;
  }

  createRenderRoot() {
    return this;
  }
}
