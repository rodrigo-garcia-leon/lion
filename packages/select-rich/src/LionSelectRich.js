import { html, LitElement, SlotMixin } from '@lion/core';
import { LocalOverlayController, overlays } from '@lion/overlays';
import { FormControlMixin, InteractionStateMixin, FormRegistrarMixin } from '@lion/field';
import { ValidateMixin } from '@lion/validate';

import '../lion-select-invoker.js';

function uuid() {
  return Math.random()
    .toString(36)
    .substr(2, 10);
}

function detectInteractionMode() {
  if (navigator.appVersion.indexOf('Mac') !== -1) {
    return 'mac';
  }
  return 'default';
}

/**
 * LionSelectRich: wraps the <lion-listbox> element
 *
 * @customElement
 * @extends LionField
 */
export class LionSelectRich extends FormRegistrarMixin(
  InteractionStateMixin(ValidateMixin(FormControlMixin(SlotMixin(LitElement)))),
) {
  static get properties() {
    return {
      ...super.properties,
      checkedValue: {
        type: Object,
      },

      disabled: {
        type: Boolean,
        reflect: true,
      },

      opened: {
        type: Boolean,
        reflect: true,
      },

      interactionMode: {
        type: String,
        attribute: 'interaction-mode',
      },

      modelValue: {
        type: Array,
      },

      name: {
        type: String,
      },
    };
  }

  static _isPrefilled(modelValue) {
    if (!modelValue) {
      return false;
    }
    const checkedModelValue = modelValue.find(subModelValue => subModelValue.checked === true);
    if (!checkedModelValue) {
      return false;
    }

    const { value } = checkedModelValue;
    return super._isPrefilled(value);
  }

  get slots() {
    return {
      ...super.slots,
      invoker: () => {
        return document.createElement('lion-select-invoker');
      },
    };
  }

  get _invokerNode() {
    return this.querySelector('[slot=invoker]');
  }

  get _listboxNode() {
    return this.querySelector('[slot=input]');
  }

  get _listboxActiveDescendantNode() {
    return this._listboxNode.querySelector(`#${this._listboxActiveDescendant}`);
  }

  get checkedIndex() {
    if (this.modelValue) {
      return this.modelValue.findIndex(el => el.value === this.checkedValue);
    }
    return -1;
  }

  set checkedIndex(index) {
    if (this.formElements[index]) {
      this.formElements[index].checked = true;
    }
  }

  get activeIndex() {
    return this.formElements.findIndex(el => el.active === true);
  }

  set activeIndex(index) {
    if (this.formElements[index]) {
      this.formElements[index].active = true;
    }
  }

  constructor() {
    super();
    this.interactionMode = 'auto';
    this.formElements = [];
    this.disabled = false;
    this.opened = false;
    // for interaction states
    this._valueChangedEvent = 'select-model-value-changed';
    this._listboxActiveDescendant = null;

    this.__onOptionActiveChanged = this.__onOptionActiveChanged.bind(this);
    this.__onChildModelValueChanged = this.__onChildModelValueChanged.bind(this);
    this.__listboxOnKeyUp = this.__listboxOnKeyUp.bind(this);
    this.__onKeyUp = this.__onKeyUp.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  connectedCallback() {
    super.connectedCallback(); // eslint-disable-line wc/guard-super-call
    this.addEventListener('active-changed', this.__onOptionActiveChanged);
    this.addEventListener('model-value-changed', this.__onChildModelValueChanged);
    this.addEventListener('keyup', this.__onKeyUp);

    this.__setupOverlay();

    this._invokerNode.id = `invoker-${this._inputId}`;
    this._invokerNode.setAttribute('aria-haspopup', 'listbox');

    this.__setupInvokerNodeEventListener();
  }

  _requestUpdate(name, oldValue) {
    super._requestUpdate(name, oldValue);
    if (
      name === 'checkedValue' &&
      !this.__isSyncingCheckedAndModelValue &&
      this.modelValue &&
      this.modelValue.length > 0
    ) {
      if (this.checkedIndex) {
        this.checkedIndex = this.checkedIndex;
      }
    }

    if (name === 'modelValue') {
      this.dispatchEvent(new CustomEvent('select-model-value-changed'));
      this.__onModelValueChanged();
    }

    if (name === 'interactionMode') {
      if (this.interactionMode === 'auto') {
        this.interactionMode = detectInteractionMode();
      }
    }
  }

  updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has('opened')) {
      if (this.opened) {
        this.__overlay.show();
      } else {
        this.__overlay.hide();
      }
    }

    if (changedProps.has('disabled')) {
      // TODO: improve implementation -> property, seprate Mixin?
      if (this.disabled) {
        this._invokerNode.tabIndex = -1;
      } else {
        this._invokerNode.tabIndex = 0;
      }
    }
  }

  firstUpdated() {
    super.firstUpdated();
    this.shadowRoot.querySelector('slot[name=input]').addEventListener('slotchange', () => {
      this._listboxNode.role = 'listbox';
      this._listboxNode.addEventListener('click', () => {
        this.opened = false;
      });
      this._listboxNode.addEventListener('keyup', this.__listboxOnKeyUp);
    });
  }

  toggle() {
    this.opened = !this.opened;
  }

  /**
   * @override
   */
  // eslint-disable-next-line
  inputGroupInputTemplate() {
    return html`
      <div class="input-group__input">
        <slot name="invoker"></slot>
        <slot name="input"></slot>
      </div>
    `;
  }

  inputGroupTemplate() {
    return html`
      <div class="input-group">
        ${this.inputGroupBeforeTemplate()}
        <div class="input-group__container">
          ${this.inputGroupPrefixTemplate()} ${this.inputGroupInputTemplate()}
          ${this.inputGroupSuffixTemplate()}
        </div>
        ${this.inputGroupAfterTemplate()}
      </div>
    `;
  }

  addFormElement(child) {
    super.addFormElement(child);
    // we need to adjust the elements beeing registered
    /* eslint-disable no-param-reassign */
    child.id = child.id || `${this.localName}-option-${uuid()}`;

    if (this.disabled) {
      child.disabled = true;
    }
    // the first elements checked by default
    if (this.formElements.length === 1) {
      child.active = true;
      child.checked = true;
    }

    this.__setAttributeForAllFormElements('aria-setsize', this.formElements.length);
    child.setAttribute('aria-posinset', this.formElements.length);

    this.__onChildModelValueChanged({ target: child });
    this.resetInteractionState();
    /* eslint-enable no-param-reassign */
  }

  _getFromAllFormElements(property) {
    return this.formElements.map(e => e[property]);
  }

  /**
   * add same aria-label to invokerNode as inputElement
   * @override
   */
  _onAriaLabelledbyChanged({ _ariaLabelledby }) {
    if (this.inputElement) {
      this.inputElement.setAttribute('aria-labelledby', _ariaLabelledby);
    }
    if (this._invokerNode) {
      this._invokerNode.setAttribute(
        'aria-labelledby',
        `${_ariaLabelledby} ${this._invokerNode.id}`,
      );
    }
  }

  /**
   * add same aria-label to invokerNode as inputElement
   * @override
   */
  _onAriaDescribedbyChanged({ _ariaDescribedby }) {
    if (this.inputElement) {
      this.inputElement.setAttribute('aria-describedby', _ariaDescribedby);
    }
    if (this._invokerNode) {
      this._invokerNode.setAttribute('aria-describedby', _ariaDescribedby);
    }
  }

  __onOptionActiveChanged({ target }) {
    if (target.active === true) {
      this.formElements.forEach(formElement => {
        if (formElement !== target) {
          // eslint-disable-next-line no-param-reassign
          formElement.active = false;
        }
      });
      this._listboxNode.setAttribute('aria-activedescendant', target.id);
    }
  }

  __setAttributeForAllFormElements(attribute, value) {
    this.formElements.forEach(formElement => {
      formElement.setAttribute(attribute, value);
    });
  }

  __onChildModelValueChanged({ target }) {
    if (target.checked) {
      this.formElements.forEach(formElement => {
        if (formElement !== target) {
          // eslint-disable-next-line no-param-reassign
          formElement.checked = false;
        }
      });
    }
    this.modelValue = this._getFromAllFormElements('modelValue');
  }

  __onModelValueChanged() {
    this.__isSyncingCheckedAndModelValue = true;

    const foundChecked = this.modelValue.find(subModelValue => subModelValue.checked);
    if (foundChecked && foundChecked.value !== this.checkedValue) {
      this.checkedValue = foundChecked.value;

      // sync to invoker
      this._invokerNode.selectedElement = this.formElements[this.checkedIndex];
    }

    this.__isSyncingCheckedAndModelValue = false;
  }

  /**
   * @desc
   * Handle various keyboard controls; UP/DOWN will shift focus; SPACE selects
   * an item.
   *
   * @param ev - the keydown event object
   */
  __listboxOnKeyUp(ev) {
    if (this.disabled) {
      return;
    }

    const { key } = ev;

    switch (key) {
      case 'Escape':
      case 'Tab':
        ev.preventDefault();
        this.opened = false;
        break;
      case 'Enter':
      case ' ':
        ev.preventDefault();
        if (this.interactionMode === 'mac') {
          this.checkedIndex = this.activeIndex;
        }
        this.opened = false;
        break;
      case 'ArrowUp':
        ev.preventDefault();
        this.activeIndex -= 1;
        break;
      case 'ArrowDown':
        ev.preventDefault();
        this.activeIndex += 1;
        break;
      case 'Home':
        ev.preventDefault();
        this.activeIndex = 0;
        break;
      case 'End':
        ev.preventDefault();
        this.activeIndex = this.formElements.length - 1;
        break;
      /* no default */
    }

    const keys = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (keys.includes(key) && this.interactionMode === 'default') {
      this.checkedIndex = this.activeIndex;
    }
  }

  __onKeyUp(ev) {
    if (this.disabled) {
      return;
    }

    if (this.opened) {
      return;
    }

    const { key } = ev;
    switch (key) {
      case 'ArrowUp':
        ev.preventDefault();
        if (this.interactionMode === 'mac') {
          this.opened = true;
        } else {
          this.activeIndex -= 1;
        }
        break;
      case 'ArrowDown':
        ev.preventDefault();
        if (this.interactionMode === 'mac') {
          this.opened = true;
        } else {
          this.activeIndex += 1;
        }
        break;
      /* no default */
    }
  }

  __setupInvokerNodeEventListener() {
    this.__invokerOnClick = () => {
      if (!this.disabled) {
        this.toggle();
      }
    };
    this._invokerNode.addEventListener('click', this.__invokerOnClick);

    this.__invokerOnBlur = () => {
      this.dispatchEvent(new Event('blur'));
    };
    this._invokerNode.addEventListener('blur', this.__invokerOnBlur);
  }

  __setupOverlay() {
    this.__overlay = overlays.add(
      new LocalOverlayController({
        contentNode: this._listboxNode,
        invokerNode: this._invokerNode,
        hidesOnEsc: false,
        hidesOnOutsideClick: true,
        inheritsReferenceObjectWidth: true,
        popperConfig: {
          placement: 'bottom-start',
          modifiers: {
            flip: {
              behavior: ['bottom-start', 'top-start'],
            },
            offset: {
              enabled: false,
            },
          },
        },
      }),
    );

    this.__overlayOnShow = () => {
      this.opened = true;
      if (this.checkedIndex) {
        this.activeIndex = this.checkedIndex;
      }
      this._listboxNode.focus();
    };
    this.__overlay.addEventListener('show', this.__overlayOnShow);

    this.__overalyOnHide = () => {
      this.opened = false;
      this._invokerNode.focus();
    };
    this.__overlay.addEventListener('hide', this.__overalyOnHide);
  }

  // eslint-disable-next-line class-methods-use-this
  __isRequired(modelValue) {
    const checkedModelValue = modelValue.find(subModelValue => subModelValue.checked === true);
    if (!checkedModelValue) {
      return { required: false };
    }
    const { value } = checkedModelValue;
    return {
      required:
        (typeof value === 'string' && value !== '') ||
        (typeof value !== 'string' && value !== undefined && value !== null),
    };
  }
}
