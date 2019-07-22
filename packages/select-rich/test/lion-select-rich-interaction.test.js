import { expect, fixture, html, aTimeout } from '@open-wc/testing';

import '@lion/option/lion-option.js';
import '../lion-options.js';
import '../lion-select-rich.js';

describe('lion-select-rich interactions', () => {
  describe('values', () => {
    it('registers options', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(el.formElements.length).to.equal(2);
      expect(el.formElements).to.eql([
        el.querySelectorAll('lion-option')[0],
        el.querySelectorAll('lion-option')[1],
      ]);
    });

    it('has the first element by default checked and active', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      await el.registrationReady;

      expect(el.querySelector('lion-option').checked).to.be.true;
      expect(el.querySelector('lion-option').active).to.be.true;
      expect(el.modelValue).to.deep.equal([
        { value: 10, checked: true },
        { value: 20, checked: false },
      ]);
      expect(el.checkedValue).to.equal(10);

      expect(el.checkedIndex).to.equal(0);
      expect(el.activeIndex).to.equal(0);
    });

    it('allows null choiceValue', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${null}>Please select value</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(el.modelValue).to.deep.equal([
        { value: null, checked: true },
        { value: 20, checked: false },
      ]);
      expect(el.checkedValue).to.be.null;
    });

    it('has the checked option as modelValue', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20} checked>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      await aTimeout();
      expect(el.modelValue).to.deep.equal([
        { value: 10, checked: false },
        { value: 20, checked: true },
      ]);
      expect(el.checkedValue).to.equal(20);
    });

    it('syncs checkedValue to modelValue', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      el.checkedValue = 20;
      expect(el.modelValue).to.deep.equal([
        { value: 10, checked: false },
        { value: 20, checked: true },
      ]);
    });

    it('has an activeIndex', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      // TODO: special registerComplete promise
      await aTimeout();

      expect(el.activeIndex).to.equal(0);

      el.querySelectorAll('lion-option')[1].active = true;
      await el.updateComplete;

      expect(el.querySelectorAll('lion-option')[0].active).to.be.false;
      expect(el.activeIndex).to.equal(1);
    });
  });

  describe('Disabled', () => {
    it('can not be focused if disabled', async () => {
      const el = await fixture(html`
        <lion-select-rich disabled> </lion-select-rich>
      `);
      expect(el.tabIndex).to.equal(-1);
    });

    it('can not be navigated with keyboard if disabled', async () => {
      const el = await fixture(html`
        <lion-select-rich disabled>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
      await el.updateComplete;
      expect(el.checkedValue).to.equal(10);
    });

    it('can not be opened via click if disabled', async () => {
      const el = await fixture(html`
        <lion-select-rich disabled> </lion-select-rich>
      `);
      el._invokerNode.click();
      expect(el.opened).to.be.false;
    });
  });

  describe('Keyboard navigation', () => {
    it('does not allow to navigate above the first or below the last option', async () => {
      const el = await fixture(html`
        <lion-select-rich opened>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(() => {
        el.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
        el.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
      }).to.not.throw();
      expect(el.checkedIndex).to.equal(0);
      expect(el.activeIndex).to.equal(0);
    });

    it('navigates to first and last option with [Home] and [End] keys', async () => {
      const el = await fixture(html`
        <lion-select-rich opened>
          <lion-options slot="input" name="foo">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
            <lion-option .choiceValue=${30} checked>Item 3</lion-option>
            <lion-option .choiceValue=${40}>Item 4</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      await el.registrationReady;
      expect(el.checkedValue).to.equal(30);

      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'Home' }));
      expect(el.checkedValue).to.equal(10);

      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'End' }));
      expect(el.checkedValue).to.equal(40);
    });

    // TODO: nice to have
    it.skip('selects a value with single [character] key', async () => {
      const el = await fixture(html`
        <lion-select-rich opened>
          <lion-options slot="input" name="foo">
            <lion-option .choiceValue=${'a'}>A</lion-option>
            <lion-option .choiceValue=${'b'}>B</lion-option>
            <lion-option .choiceValue=${'c'}>C</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(el.choiceValue).to.equal('a');
      el.dispatchEvent(new KeyboardEvent('keyup', { key: 'C' }));
      await el.updateComplete;
      expect(el.choiceValue).to.equal('c');
    });

    it.skip('selects a value with multiple [character] keys', async () => {
      const el = await fixture(html`
        <lion-select-rich opened>
          <lion-options slot="input" name="foo">
            <lion-option .choiceValue=${'bar'}>Bar</lion-option>
            <lion-option .choiceValue=${'far'}>Far</lion-option>
            <lion-option .choiceValue=${'foo'}>Foo</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      el.dispatchEvent(new KeyboardEvent('keyup', { key: 'F' }));
      await el.updateComplete;
      expect(el.choiceValue).to.equal('far');
      el.dispatchEvent(new KeyboardEvent('keyup', { key: 'O' }));
      await el.updateComplete;
      expect(el.choiceValue).to.equal('foo');
    });
  });

  describe('Keyboard navigation Windows', () => {
    it('navigates through list with [ArrowDown] [ArrowUp] keys activates and checks the option', async () => {
      function expectOnlyGivenOneOptionToBeChecked(options, selectedIndex) {
        options.forEach((option, i) => {
          if (i === selectedIndex) {
            expect(option.checked).to.be.true;
          } else {
            expect(option.checked).to.be.false;
          }
        });
      }

      const el = await fixture(html`
        <lion-select-rich opened>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
            <lion-option .choiceValue=${30}>Item 3</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      // TODO: special registerComplete promise
      await aTimeout();

      const options = Array.from(el.querySelectorAll('lion-option'));
      expect(el.activeIndex).to.equal(0);
      expect(el.checkedIndex).to.equal(0);
      expectOnlyGivenOneOptionToBeChecked(options, 0);

      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
      await el.updateComplete;
      expect(el.activeIndex).to.equal(1);
      expect(el.checkedIndex).to.equal(1);
      expectOnlyGivenOneOptionToBeChecked(options, 1);

      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
      await el.updateComplete;
      expect(el.activeIndex).to.equal(0);
      expect(el.checkedIndex).to.equal(0);
      expectOnlyGivenOneOptionToBeChecked(options, 0);
    });

    // TODO: enable and make work
    it.skip('skips disabled options while navigating through list with [ArrowDown] [ArrowUp] keys', async () => {
      const el = await fixture(html`
        <lion-select-rich opened>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20} disabled>Item 2</lion-option>
            <lion-option .choiceValue=${30}>Item 3</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
      expect(el.checkedIndex).to.equal(2);
      expect(el.activeIndex).to.equal(2);

      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
      expect(el.checkedIndex).to.equal(0);
      expect(el.activeIndex).to.equal(0);
    });
  });

  describe('Keyboard navigation Mac', () => {
    it('navigates through open list with [ArrowDown] [ArrowUp] keys activates the option', async () => {
      const el = await fixture(html`
        <lion-select-rich opened interaction-mode="mac">
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
            <lion-option .choiceValue=${30}>Item 3</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      // TODO: special registerComplete promise
      await aTimeout();

      expect(el.activeIndex).to.equal(0);
      expect(el.checkedIndex).to.equal(0);

      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
      await el.updateComplete;
      expect(el.activeIndex).to.equal(1);
      expect(el.checkedIndex).to.equal(0);

      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
      await el.updateComplete;
      expect(el.activeIndex).to.equal(0);
      expect(el.checkedIndex).to.equal(0);
    });
  });

  // TODO: nice to have
  describe.skip('Read only', () => {
    it('can be focused if readonly', async () => {
      const el = await fixture(html`
        <lion-listbox readonly> </lion-listbox>
      `);
      expect(el.tabIndex).to.equal('-1');
    });

    it('can not be navigated with keyboard if readonly', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input" name="foo">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
      await el.updateComplete;
      expect(el.choiceValue).to.equal(10);
    });
  });

  describe('Programmatic interaction', () => {
    it('can set active state', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20} id="myId">Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      const opt = el.querySelectorAll('lion-option')[1];
      opt.active = true;
      expect(el._listboxNode.getAttribute('aria-activedescendant')).to.equal('myId');
    });

    it('can set checked state', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      const option = el.querySelectorAll('lion-option')[1];
      option.checked = true;
      expect(el.modelValue).to.deep.equal([
        { value: 10, checked: false },
        { value: 20, checked: true },
      ]);
    });

    it('does not allow to set checkedIndex or activeIndex to be out of bound', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(() => {
        el.activeIndex = -1;
        el.activeIndex = 1;
        el.checkedIndex = -1;
        el.checkedIndex = 1;
      }).to.not.throw();
      expect(el.checkedIndex).to.equal(0);
      expect(el.activeIndex).to.equal(0);
    });

    it('unsets checked on other options when option becomes checked', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      const options = el.querySelectorAll('lion-option');
      expect(options[0].checked).to.be.true;
      options[1].checked = true;
      expect(options[0].checked).to.be.false;
    });

    it('unsets active on other options when option becomes active', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      const options = el.querySelectorAll('lion-option');
      expect(options[0].active).to.be.true;
      options[1].active = true;
      expect(options[0].active).to.be.false;
    });
  });

  describe('Interaction states', () => {
    it('becomes dirty if value changed once', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(el.dirty).to.be.false;
      el.checkedValue = 20;
      await el.updateComplete;
      expect(el.dirty).to.be.true;
    });

    it('becomes touched if blurred once', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(el.touched).to.be.false;
      el._invokerNode.focus();
      el._invokerNode.blur();
      expect(el.touched).to.be.true;
    });

    it('is prefilled if there is a value on init', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(el.prefilled).to.be.true;

      const elEmpty = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${null}>Please select a value</lion-option>
            <lion-option .choiceValue=${10}>Item 1</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(elEmpty.prefilled).to.be.false;
    });
  });

  describe('Validation', () => {
    it('can be required', async () => {
      const el = await fixture(html`
        <lion-select-rich .errorValidators=${['required']}>
          <lion-options slot="input">
            <lion-option .choiceValue=${null}>Please select a value</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(el.error.required).to.be.true;
      el.checkedValue = 20;
      expect(el.error.required).to.be.undefined;
    });
  });

  describe('Accessibility', () => {
    it('creates unique ids for all children', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input" name="foo">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20} selected>Item 2</lion-option>
            <lion-option .choiceValue=${30} id="predefined">Item 3</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(el.querySelectorAll('lion-option')[0].id).to.exist;
      expect(el.querySelectorAll('lion-option')[1].id).to.exist;
      expect(el.querySelectorAll('lion-option')[2].id).to.equal('predefined');
    });

    it('has a reference to the selected option', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input" name="foo">
            <lion-option .choiceValue=${10} id="first">Item 1</lion-option>
            <lion-option .choiceValue=${20} checked id="second">Item 2</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      expect(el._listboxNode.getAttribute('aria-activedescendant')).to.equal('first');
      el._listboxNode.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
      expect(el._listboxNode.getAttribute('aria-activedescendant')).to.equal('second');
    });

    it('puts "aria-setsize" on all options to indicate the total amount of options', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input" name="foo">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
            <lion-option .choiceValue=${30}>Item 3</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      const optionEls = [].slice.call(el.querySelectorAll('lion-option'));
      optionEls.forEach(optionEl => {
        expect(optionEl.getAttribute('aria-setsize')).to.equal('3');
      });
    });

    it('puts "aria-posinset" on all options to indicate their position in the listbox', async () => {
      const el = await fixture(html`
        <lion-select-rich>
          <lion-options slot="input">
            <lion-option .choiceValue=${10}>Item 1</lion-option>
            <lion-option .choiceValue=${20}>Item 2</lion-option>
            <lion-option .choiceValue=${30}>Item 3</lion-option>
          </lion-options>
        </lion-select-rich>
      `);
      const optionEls = [].slice.call(el.querySelectorAll('lion-option'));
      optionEls.forEach((oEl, i) => {
        expect(oEl.getAttribute('aria-posinset')).to.equal(`${i + 1}`);
      });
    });
  });
});
