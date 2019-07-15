import { storiesOf, html } from '@open-wc/demoing-storybook';
import '../lion-button.js';

storiesOf('Buttons|Button', module)
  .add('Button', () => {
    return html`
      <lion-button @click="${e => console.log('external click handler', e, e.target)}"
        >lion-button</lion-button
      >
    `;
  })
  .add('IE11 click twice bug', () => {
    setTimeout(() => {
      document.querySelector('#my-div').addEventListener('click', e => {
        console.log('div: clicked', e, e.target);
      });
    }, 100);
    return html`
      <style>
        .demo-box {
          display: flex;
          padding: 8px;
        }

        lion-button {
          margin: 8px;
        }
      </style>
      <div class="demo-box">
        <div
          id="my-div"
          @click=${e => {
            if (e.isTrusted) {
              e.stopImmediatePropagation();
              console.log('div: stop propogation', e, e.target);
            }
          }}
          style="pointer-events: none; background-color: green; padding: 10px; position: relative; width: 100px; height: 100px;"
        >
          <span
            style="pointer-events: auto; background-color: red; width: 100px; height: 100px; position: absolute;"
          >
            span
          </span>
        </div>
        <!-- <lion-button
        @click=${e => {
          console.log('lion-button: clicked', e, e.target);
        }}
      >
        lion-button
      </lion-button> -->
      </div>
    `;
  });
