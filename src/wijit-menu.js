/**
 * @class WijitMenu
 * @extends HTMLElement
 * @description A web component that displays a menu in various styles from a user-provided <menu> or <ul> list.
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 */

export class WijitMenu extends HTMLElement {
  #custom = false;
  #speed = '.75s';
  #height = '45px';

  #abortController = new AbortController();
  #observer;

  defaultStyleId = 'wijit-menu-default-styles';

  static allowed = {
    custom: [null, "", "true", true, "false", false]
  };

  static observedAttributes = ['custom', 'height', 'speed'];
  /**
   * @constructor
   */
  constructor() {
    super();
  }

  connectedCallback() {
    const options = { childList:true, subtree:true };
    this.#observer = new MutationObserver( records => {
      this.observeMenu(records)
    });

    if (!this.custom) this.addDefaultStyles();
    this.init();

    // observe must happen after ini()
    this.#observer.observe(this, options);
  }

  disconnectedCallback() {
    this.#observer.disconnect();
    this.#abortController.abort();
  }

  /**
   * @override
   * @param {string} attr
   * @param {string} oldval
   * @param {string} newval
   */
  attributeChangedCallback(attr, oldval, newval) {
    if (WijitMenu.allowed[attr] && !WijitMenu.allowed[attr].has(newval)) {
      const allowed = JSON.stringify(Array.from(WijitMenu.allowed[attr].values()));
      console.error(`Value of "${attr}" must be one of ${allowed}. Value given was: ${newval}`)
      return false;
    }

    this[attr] = newval;
    this.sendEvent(attr, oldval, newval);
  }

  /**
   * Observe menu items for changes.
   * If something is added, check all additions for <li> elements.
   * If <li> elements are found, for each <li> add a label if needed.
   * @param  {[type]} records  [description]
   *
   * @test const li = document.createElement('li');
      li.innerHTML = '<a>bar</a><menu><li><a>baz</a></li></menu>';
      self.append(li);
      return self.hasLabel(li) // true
   */
  observeMenu(records) {
    for (const record of records) {
      for (const added of record.addedNodes) {
        if (added.localName === 'li') {
          if (this.hasChildMenu(added)) {
            if (!this.hasLabel(added)) this.addLabel(added);
          }
        }
      }
    }
  }

  /**
   * Scan for <li> elements.
   * For each <li>, call hasChildMenu() to check if the <li> has a child <menu> or <ul>.
   * If yes, call hasLabel() to check if <li> has a label element.
   * If hasLabel() returns false, call addLabel().
   */
  init() {
    const lis = this.querySelectorAll('li');
    for (const li of lis) {
      if (this.hasChildMenu(li)) {
        if (!this.hasLabel(li)) this.addLabel(li);
      }
    }
  }

  /**
   * Determin if an <li> element has a child <menu> or <ul>
   * @param  {HTMLLIElement}  li An <li> element.
   * @returns {Boolean}    Whether the <li> has a child <menu> or <ul>
   *
   * @test self.li = document.createElement('li');
      return self.hasChildMenu(self.li) // false
   * @test noreset self.li.innerHTML = 'foo <menu><li>bar</li></menu>';
      return self.hasChildMenu(self.li) // true
   */
  hasChildMenu(li) {
    if (!li) return;
    if (!li instanceof HTMLLIElement) {
      return this.sendError('Argument for hasChildMenu() must be instance of HTMLLIElement', li );
    }

    const search = ['menu', 'ul'];
    for (const child of li.children) {
      if (search.indexOf(child.localName) > -1) return true;
    }

    return false;
  }

  /**
   * Check if <li> element has a <label> as a direct child
   * @param  {HTMLLIElement}  li An <li> element.
   * @returns {Boolean}    Whether the li has a <label> as a direct child.
   *
   * @test self.li = document.createElement('li');
      return self.hasLabel(self.li) // false
   * @test noreset self.li.innerHTML = '<label>foo</label><menu><li><a>bar</a></li></menu>';
      return self.hasLabel(self.li) // true
   */
  hasLabel(li) {
    if (!li) return;
    if (!li instanceof HTMLLIElement) {
      return this.sendError('Argument for hasLabel() must be instance of HTMLLIElement', li );
    }

    for (const child of li.children) {
      if (child.localName === 'label') return true;
    }

    return false;
  }

  /**
   * Prepend label to li element and move li element's first text node to the label.
   * @param {HTMLLIElement} li An li element
   *
   * @test const li = document.createElement('li');
      li.innerHTML = '<a>foo</a>';
      return !!self.addLabel(li).querySelector('label') // true
   */
  addLabel(li) {
    if (!li) return;
    if (!li instanceof HTMLLIElement) {
      return this.sendError('Argument for addLabel() must be instance of HTMLLIElement', li);
    }

    const label = document.createElement('label');
    const input = document.createElement('input');
    const node = this.getFirstTextOrLink(li);
    input.type = 'checkbox';
    // input.setAttribute('hidden', true);
    label.append(input);
    label.append(node);
    li.prepend(label);
    return li;
  }

  /**
   * Get the text of the first node of an <li> element.
   * @param  {HTMLLIElement} li An li element
   * @returns {string} The text content.
   *
   * @test self.li = document.createElement('li');
      return self.getFirstTextNode(self.li) // null
   * @test noreset self.li.innerHTML = 'foo <menu>bar</menu>';
      return self.getFirstTextNode(self.li) // 'foo'
   * @test noreset self.li.innerHTML = '<a>foo</a><menu>bar</menu>';
      return self.getFirstTextNode(self.li) // 'foo'
   */
  getFirstTextOrLink(li) {
    if (!li) return;
    if (!li instanceof HTMLLIElement) {
      return this.sendError('Argument for getFirstText() must be instance of HTMLLIElement', li);
    }

    for (const child of li.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim() !== "") {
        return child;
      } else if (child.localName === 'a') {
        return child;
      }
    }

    return null;
  }

  /**
   * Add click and blur event listener to menu. If blur, or click target is a link, remove the 'active' attribute.
   */
  addListeners() {
    this.addEventListener('click', event => {
      if (event.target.localName === 'a') this.removeAttribute('active');
    }, { signal:this.#abortController.signal } );

    this.addEventListener('blur', event => {
      this.removeAttribute('active');
    }, { signal:this.#abortController.signal });
  }

  /**
   * Add click event listener to document.body. If target is not in the menu, remove the 'active' attribute.
   * @returns {[type]} [description]
   */
  addDocumentClickHandler() {
    document.body.addEventListener('click', event => {
      if (!!event.target.closest(this.localName)) this.removeAttribute('active');
    }, { signal:this.#abortController.signal });
  }

  sendError(msg, value) {
    console.error(`${msg}. Value given was ${value}`);
    return false;
  }

  /**
   * @private
   * @param {string} attr
   * @param {*} oldval
   * @param {*} newval
   */
  sendEvent(attr, oldval, newval) {
    const info = { attr:attr, old:oldval, new:newval };
    const evt = new CustomEvent('wijitChanged', { detail:info });
    window.dispatchEvent(evt);
  }

  addDefaultStyles() {
    const style = document.head.querySelector(`#${this.defaultStyleId}`);
    if (!style) document.head.append(this.defaultStyles());
  }


  /**
   * Default menu styles
   * @returns {HTMLStyleElement} A <style> element containing the default menu styles
   */
  defaultStyles() {
    const style = document.createElement('style');
    style.id = this.defaultStyleId;
    style.textContent = `
      wijit-menu {
        --bg1-color: rgb(250, 250, 250);
        --bg2-color: #f2f2f2;
        --bg3-color: white;
        --border-color: silver;
        --text-color: rgb(60,60,60);
        --accent: skyblue;
        --accent-text: rgb(40, 40, 40);
        --height: ${this.height};
        --speed: ${this.speed};
      }

      @media (prefers-color-scheme: dark) {
        wijit-menu {
          --bg1-color: rgb(20, 20, 20);
          --bg2-color: rgb(40,40,40);
          --bg3-color: rgb(60, 60, 60);
          --border-color: dimgray;
          --text-color: rgb(240, 240, 240);
          --accent: dodgerblue;
          --accent-text: white;
        }
      }

      wijit-menu {

      /****** Backgrounds ******/
        background-color: var(--bg2-color);

        & label:has(input:checked)::after,
        & label:has(input:checked)::before {
          background-color: var(--bg2-color);
        }

        & li > menu
        { background: var(--bg3-color); }

        & li:not(:has(input:checked)):hover {
          background-image: linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(0,0,0,0.2));
        }

        & li:not(:has(input:checked)):active {
          background-image: linear-gradient(to top, rgba(255,255,255,0.2), rgba(0,0,0,0.2));
        }

      /****** Borders ******/

        & li
        { border: solid var(--border-color); }

        & li
        { border-width: 1px 0 0 0; }

        & li:first-child
        { border-width: 0; }

        & menu
        { border-radius: 1rem 0 0 1rem; }

        & li li:first-child
        { border-radius: 1rem 0 0 0; }

        & li:last-child
        { border-radius:0 0 0 1rem }

      /****** Text ******/

        & a,
        & input[type=checkbox],
        & input[type=radio]
        { color: var(--text-color) }

        & a:active,
        & a:hover,
        & label:active,
        & label:hover a,
        & label:hover input,
        & li label:has(input:checked) > a,
        & li label:has(input:checked) > input
        { color: var(--accent); }

        & a,
        & label,
        & input[type=checkbox],
        & input[type=radio]
        { font-weight: bold; }

        & input[type=checkbox],
        & input[type=radio]
        { font-size: 1.5rem }

        & a
        { text-decoration: none }

        & a[href]:hover
        { text-decoration: underline; }

      /****** Shadows ******/

        & a[href]:active {
          box-shadow: inset 1px 1px 5px black;
        }

      /****** Cursors ******/

          & label,
          & input[type=checkbox],
          & input[type=radio]
          { cursor: pointer }

      /****** Structure ******/
        margin: 0;
        padding: 0;
        width: 100%;

        & a {
          text-align: left;
          flex: 1;
          padding: .5rem;
        }

        & input[type=checkbox],
        & input[type=radio] {
          appearance: none;
          aspect-ratio: 1/1;
          display: inline-block;
          margin: .5rem;
          position: relative;
          transition: all .25s;
          vertical-align: middle;
          width: 1.5rem;
        }

        & input[type=checkbox]:checked,
        & input[type=radio]:checked {
          transform: rotate(90deg);
        }

        & input[type=checkbox]:before,
        & input[type=radio]:before {
          align-items: center;
          content: "▶";
          display: flex;
          justify-content: center;
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
        }

        & label {
          align-items: center;
          display: flex;
          justify-content: start;
          flex: 2;
        }

        & label:has(input) {
          flex: 2;
        }

        & label:has(input:checked) {
          flex: 0;
        }

        & label > a {
          flex: 0;
          min-width: max-content;
        }

        & label:has(input) + menu,
        & label:has(input) + ul
        {
          max-height: 0rem;
          flex: 0;
          opacity: 0;
          overflow: hidden;
        }

        & label:has(input:checked) + ul,
        & label:has(input:checked) + menu {
          flex: 2;
          max-height: 1000vh;
          opacity: 1;
          overflow: visible;
          z-index: 100;
        }

        & li {
          align-content: center;
          align-items: stretch; /* for menu with single li */
          display: flex;
          flex-wrap: wrap;
          min-height: var(--height);
          overflow: hidden;
          position: relative;
        }

        & li > menu
        & li > ul
        {
          max-height: 0%;
          overflow: hidden;
        }

        & li > menu > li,
        & li > ul > li
        {
          width: max-content;
          min-width: 100%;
        }

        & menu,
        & ul
        {
          list-style: none;
          margin: 0;
          padding: 0;
          transition: all var(--speed);
        }
      } /** wijit-menu **/

      wijit-menu.inset li > menu {
        box-shadow: inset 5px 5px 10px rgba(0, 0, 0, 0.5);
      }

      wijit-menu.curly {
        & label:has(input:checked) {
          background-color: var(--bg3-color);
          border: none;
          display: inline-block;
          margin: auto 0;
          min-width: 10rem;
        }

        & label:has(input:checked)::after,
        & label:has(input:checked)::before {
          color: transparent;
          content: ".";
          display: inline-block;
          width: 100%;
          height: 4rem;
        }

        & label:has(input:checked)::before {
          border-radius: 0 0 1rem 0;
        }

        & label:has(input:checked)::after {
          border-radius: 0 1rem 0 0;
        }

        & menu label:has(input:checked) {
          background-color: var(--bg2-color);
          border-radius: 1rem;
        }

        & menu label:has(input:checked)::after {
          background-color: var(--bg3-color);
          border-radius: 1rem 0 0 0;
        }

        & menu label:has(input:checked)::before {
          background-color: var(--bg3-color);
          border-radius: 0 0 0 .5rem;
        }

        & li li a {
          padding-left: 1.5rem;
        }
      }

      wijit-menu.ribbon {
        align-items: start;
        background-color: transparent;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        position: relative;
        z-index: 0;

        & label a {
          flex: 1;
        }

        & li {
          border-radius: 0;
          border-width: 0 0 0 1px;
          position: static;
        }

        & li:first-child {
          border-radius: 0;
          border-width: 0;
        }

        & label:has(input:checked) + menu,
        & li:has(label):hover > menu {
          border: 1px solid var(--border-color);
          max-height: 1000vh;
          overflow: visible;
          z-index: 100;
        }

        & li:has(label):hover > label > input[type=checkbox],
        & li:has(label):hover > label > input[type=radio] {
          transform: rotate(90deg);
        }

        & label + menu
        {
          left: 0;
          max-height: 0;
          overflow: hidden;
          position: absolute;
          top: var(--height);
          width: 100%;
          z-index: -1;
        }

        & li > menu > li {
          width: max-content;
          min-width: auto;
        }

        & menu {
          border-radius: 1rem;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          box-shadow: 2px 2px 10px black;
        }

        & menu > li {
          position: static;
        }
      } /** wijit-menu.ribbon **/

      wijit-menu.oldschool {
        align-items: start;
        background-color: transparent;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        position: relative;
        z-index: 1;

        > li:last-child {
          border-width: 0;
        }

        & label a {
          flex: 1;
        }

        & > li {
          border-radius: 0;
          border-width: 0 1px 0 0;
          position: relative;
          overflow: visible;
        }

        & li li:first-child {
          border-radius: 1rem 1rem 0 0;
        }

        & label:has(input:checked) + menu,
        & li:has(label):hover > menu {
          border: 1px solid var(--border-color);
          max-height: 1000vh;
          overflow: visible;
          z-index: 100;
        }

        & li:has(label):hover > label > input[type=checkbox],
        & li:has(label):hover > label > input[type=radio] {
          transform: rotate(90deg);
        }

        & li > menu {
          left: 0;
          max-height: 0;
          min-width: 100%;
          overflow: hidden;
          position: absolute;
          top: var(--height);
          z-index: -1;
        }

        & li > menu > li {
          border-radius: 0;
        }

        & li > menu > li > menu {
          left: 100%;
          top: -100%;
        }

        & menu {
          border-radius: 1rem;
          box-shadow: 2px 2px 10px black;
        }

        & menu > li {
          position: relative;
          overflow: visible;
        }
      } /** wijit-menu.oldschool **/
    `;

    return style;
  }
  get custom() { return this.#custom; }

  set custom(value) {
    switch (value) {
      case 'false':
      case false:
        value = false;
        break;
      default:
        value = true;
        break;
    }

    this.#custom = value;
  }

  get height() { return this.#height; }

  set height(value) {
    this.#height = value;
    this.style.setProperty('--height', value);
  }

  get speed() { return this.#speed; }

  set speed(value) {
    if (/\d+$/.test(value)) value += 's';
    this.#speed = value;
    this.style.setProperty('--speed', value);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!customElements.get('wijit-menu')) {
    customElements.define('wijit-menu', WijitMenu);
  }
});
