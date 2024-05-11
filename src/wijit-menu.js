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
  #expand = false;

  #abortController = new AbortController();
  #observer;

  defaultStyleId = 'wijit-menu-default-styles';

  static allowed = {
    custom: new Set([null, "", "true", true, "false", false]),
    expand: new Set([null, "", "true", true, "false", false]),
  };

  static observedAttributes = ['custom', 'expand', 'height', 'speed'];
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

    // observe must happen after init()
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
    input.type = "checkbox";
    input.name = 'wm-checkbox';
    input.setAttribute('hidden', true);
    if (this.expand) input.checked = true;
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

  removeDefaultStyles() {
    const style = document.head.querySelector(`#${this.defaultStyleId}`);
    if (style) style.remove();
  }

  /**
   * Default menu styles
   * @returns {HTMLStyleElement} A <style> element containing the default menu styles
   */
  defaultStyles() {
    const style = document.createElement('style');
    style.id = this.defaultStyleId;
    style.textContent = `
      @layer wijit-menu {
      wijit-menu {
        --bg1-color: rgb(250, 250, 250);
        --bg2-color: whitesmoke;
        --bg3-color: white;
        --border-color: silver;
        --text-color: rgb(60,60,60);
        --accent: skyblue;
        --accent-text: rgb(40, 40, 40);
        --menu-height: ${this.height};
        --speed: ${this.speed};
      }

      @media (prefers-color-scheme: dark) {
        wijit-menu {
          --bg1-color: transparent;
          --bg2-color: rgb(40,40,40);
          --bg3-color: rgb(60, 60, 60);
          --border-color: dimgray;
          --text-color: rgb(240, 240, 240);
          --accent: dodgerblue;
          --accent-text: white;
        }
      }

      @media (pointer: fine) {
        wijit-menu.ribbon li:hover > label input[type=checkbox],
        wijit-menu.ribbon li:hover > label input[type=radio],
        wijit-menu.oldschool li:hover > label input[type=checkbox],
        wijit-menu.oldschool li:hover > label input[type=radio]
        { transform: rotate(90deg); }

        wijit-menu.ribbon li:has(label):hover > ul,
        wijit-menu.ribbon li:has(label):hover > menu,
        wijit-menu.oldschool li:has(label):hover > ul,
        wijit-menu.oldschool li:has(label):hover > menu
        {
          flex: 1;
          max-height: 300vh;
          overflow: visible;
          z-index: 1;
        }
      }

      @media all and (max-width: 500px) {
        wijit-menu a,
        wijit-menu label,
        wijit-menu ul,
        wijit-menu menu
        { width: 100%; }

        wijit-menu li
        { flex-direction: column; }

        wijit-menu ul,
        wijit-menu menu,
        wijit-menu li:first-child,
        wijit-menu li:last-child
        { border-radius: 0 }

        wijit-menu.oldschool li
        { position: static; }

        wijit-menu.oldschool
        { position: relative; }

        wijit-menu.oldschool li > menu,
        wijit-menu.oldschool li > ul
        {
          left: 0;
          top: 100%;
          width: 100%;
        }

        wijit-menu.oldschool li li > menu,
        wijit-menu.oldschool li li > ul {
          left: 0;
          top: 100%;
        }
      }

      @media all and (min-width: 501px) {
        wijit-menu ul,
        wijit-menu menu
        { border-radius: 1rem 0 0 1rem; }

        wijit-menu li:first-child
        { border-radius: 1rem 0 0 0; }

        wijit-menu li:last-child
        { border-radius: 0 0 0 1rem; }

        wijit-menu.oldschool li
        { position: relative; }

        wijit-menu.oldschool li > menu,
        wijit-menu.oldschool li > ul {
          top: 99%;
          width: max-content;
        }

        wijit-menu.oldschool li li > menu,
        wijit-menu.oldschool li li > ul {
          left: 100%;
          top: 0;
        }
      }

      wijit-menu {

      /****** Backgrounds ******/
        background-color: var(--bg1-color);

        & li menu,
        & li ul,
        & li menu menu menu,
        & li ul ul ul
        { background-color: var(--bg3-color) }

        & li menu menu,
        & li ul ul
        { background-color: var(--bg2-color) }

        & li:not(:has(input:checked)):hover
        {
          background-image: linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(0,0,0,0.1));
        }

        & li:not(:has(input:checked)):active
        {
          background-image: linear-gradient(to top, rgba(255,255,255,0.1), rgba(0,0,0,0.1));
        }

      /****** Borders ******/

        & label > a
        { border: 1px dotted var(--border-color); }

        & li > menu,
        & li > ul
        { border: solid var(--border-color); }

        & li
        { border: solid var(--border-color); }

        & li > menu,
        & li > ul
        { border-width: 0; }

        & li,
        & label:has(input:checked) + menu li
        { border-width: 1px 0 0 0; }

        & li:first-child
        { border-width: 0; }

      /****** Text ******/

        & a,
        & input[type=checkbox],
        & input[type=radio]
        { color: var(--text-color) }

        & a:hover,
        & label:hover,
        & label:hover > a,
        & label:hover input
        { color: var(--accent); }

        & a,
        & input[type=checkbox],
        & input[type=radio],
        & label
        { font-weight: bold; }

        & input[type=checkbox],
        & input[type=radio]
        { font-size: 1.5rem }

        & a
        { text-decoration: none }

        & a:hover
        { text-decoration: underline; }

      /****** Shadows ******/

        & li > menu,
        & li > ul
        { box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.5); }

        & a[href]:active {
          box-shadow: inset 1px 1px 5px black;
        }

      /****** Cursors ******/

          & li,
          & label,
          & input[type=checkbox],
          & input[type=radio]
          { cursor: pointer }

      /****** Structure ******/
        width: 100%;

        & a {
          text-align: left;
          flex: 1;
          padding: .5rem;
          min-width: max-content;
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
        & input[type=radio]:checked
        { transform: rotate(90deg); }

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

        & label a { flex:0 }

        & label {
          align-items: center;
          display: flex;
          flex: 2;
          justify-content: start;
          padding: 0 .5rem;
          transition: all var(--speed);
        }

        & label:has(input:checked) {
          align-self: stretch;
          flex: 0;
        }

        & label:has(input) + menu,
        & label:has(input) + ul {
          flex: 0;
          max-height: 0vh;
        }

        & label:has(input:checked) + menu,
        & label:has(input:checked) + ul {
          flex: 2;
          max-height: 300vh;
          z-index: 1;
        }

        & li {
          align-items: center;
          box-sizing: border-box;
          display: flex;
          min-height: var(--menu-height);
        }

        & li:not(:has(label)) {
          padding: 0 1rem;
        }

        & menu,
        & ul {
          display: flex;
          flex-direction: column;
          list-style: none;
          margin: 0;
          padding: 0;
          overflow: hidden;
          flex: 0;
          transition: all var(--speed);
        }

        & menu menu,
        & ul ul {
          max-height: 0vh;
        }

      } /** wijit-menu **/

      wijit-menu.inset {

        & li > menu,
        & li > ul
        { box-shadow: inset 5px 5px 10px rgba(0, 0, 0, 0.5); }

      } /** .inset **/

      wijit-menu.ribbon {

        /****** Borders ******/

          & li
          { border-width: 0 0 0 1px; }

          & > ul,
          & > menu,
          & li > ul,
          & li > menu,
          & li:first-child
          { border-width: 0; }

          & li:has(label):hover > menu,
          & li:has(label):hover > ul,
          & label:has(input:checked) + menu,
          & label:has(input:checked) + ul
          { border: 1px solid var(--border-color); }

          & li,
          & li li:first-child
          { border-radius: 0 }

          & menu,
          & ul
          { border-radius: .5rem }

          & > menu > li:first-child,
          & > ul > li:first-child
          { border-radius: .5rem 0 0 .5rem }

          & > menu > li:last-child,
          & > ul > li:last-child
          { border-radius: 0 .5rem .5rem 0 }

        /****** Structure ******/

          & label {
            flex: 1;
            justify-content: center;
          }

          & label:has(input):hover,
          & label:has(input:checked)
          { flex: 1; }

          & label:has(input:checked) + menu,
          & label:has(input:checked) + ul
          {
            flex: 1;
            max-height: 300vh;
            overflow: visible;
            z-index: 1;
          }

          & li > menu,
          & li > ul {
            left: 0;
            overflow: hidden;
            position: absolute;
            top: 99%;
            width: 100%;
          }

          & menu,
          & ul
          {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            overflow: visible;
            position: relative;
          }

      } /** .ribbon **/

      wijit-menu.oldschool {

        /****** Borders ******/

          & li:has(label):hover > menu,
          & li:has(label):hover > ul,
          & label:has(input:checked) + menu,
          & label:has(input:checked) + ul
          { border: 1px solid var(--border-color); }

          & > menu > li,
          & > ul > li
          { border-width: 0 0 0 1px; }

          & li
          { border-width: 0 0 1px 0; }

          & > ul,
          & > menu,
          & li > ul,
          & li > menu,
          & > menu > li:first-child,
          & > ul > li:first-child
          { border-width: 0; }

          & li,
          & li li:first-child
          { border-radius: 0 }

          & > menu > li:first-child,
          & > ul > li:first-child
          { border-radius: .5rem 0 0 .5rem }

          & > menu > li:last-child,
          & > ul > li:last-child
          { border-radius: 0 .5rem .5rem 0 }

          & menu,
          & ul
          { border-radius: .5rem }

        /****** Structure ******/
          & label {
            flex: 1;
            justify-content: start;
          }

          & label:has(input):hover,
          & label:has(input:checked)
          { flex: 1; }

          & label:has(input:checked) + menu,
          & label:has(input:checked) + ul
          {
            flex: 1;
            max-height: 300vh;
            overflow: visible;
          }

          & li > menu,
          & li > ul {
            flex-direction: column;
            overflow: hidden;
            position: absolute;
            z-index: 1;
          }

          & > menu,
          & > ul {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            overflow: visible;
            flex-direction: row;
          }

      } /** .oldschool **/

      wijit-menu.sitemap {
        & a {
          display: block;
        }

        & input[type=checkbox],
        & input[type=radio] {
          all: initial;
          display: none;
        }

        & input[type=checkbox]:checked,
        & input[type=radio]:checked
        {  }

        & input[type=checkbox]:before,
        & input[type=radio]:before {
          all: initial;
        }

        & label a {
          background: yellow;
          display: block;
        }

        & label {
          all: initial;
          dis
          background: tan;
        }

        & label:has(input:checked) {
          all:initial;
        }

        & label:has(input) + menu,
        & label:has(input) + ul {
          all: initial;
        }

        & label:has(input:checked) + menu,
        & label:has(input:checked) + ul {
          all: initial;
        }

        & li {
          all: initial;
        }

        & li:not(:has(label)) {
          all: initial;
        }

        & menu,
        & ul {
          border: 1px solid lime;

        }

        & menu menu,
        & ul ul {
          border: 1px solid orange;
        }
      } /** .sitemap **/

      } /** @layer **/
    `;

    return style;
  }
  get custom() { return this.#custom; }

  set custom(value) {
    switch (value) {
      case 'false':
      case false:
        value = false;
        this.removeDefaultStyles();
        break;
      default:
        value = true;
        this.addDefaultStyles();
        break;
    }

    this.#custom = value;
  }

  get expand() { return this.#expand; }

  set expand(value) {
    switch (value) {
      case 'false':
      case false:
        value = false;
        break;
      default:
        value = true;
        break;
    }

    this.#expand = value;
  }

  get height() { return this.#height; }

  set height(value) {
    this.#height = value;
    this.style.setProperty('--menu-height', value);
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
