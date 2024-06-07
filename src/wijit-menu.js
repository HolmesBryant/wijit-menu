/**
 * @class WijitMenu
 * @extends HTMLElement
 * @description A web component that displays a menu in various styles from a user-provided <menu> or <ul> list.
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 */

export class WijitMenu extends HTMLElement {
  #content;

  /**
   * @private
   */
  #expand = false;

  /**
   * @private
   */
  #height = 'auto';

  /**
   * @private
   */
  #nohover = false;

  /**
   * @private
   */
  #speed = '.5s';

  /**
   * @private
   */
  #type = 'default';

  /**
   * @private
   */
  #abortController = new AbortController();

  /**
   * @private
   */
  #inputs = new Set();

  /**
   * @private
   */
  #observer;

  /**
   * The id of the style tag for the default css styles
   * @type {String}
   */
  defaultStyleId = 'wijit-menu-styles';

  /**
   * @static
   * @typedef {Set<string | boolean | null>} AllowedValues
   * @type {Record<string, AllowedValues>}
   */
  static allowed = {
    expand: new Set([null, "", "true", true, "false", false]),
    nohover: new Set([null, "", "true", true, "false", false]),
    type: new Set([null, "", "default", "custom","oldschool", "ribbon", "sitemap"])
  };

  /**
   * @static
   * @type {string[]}
   */
  static observedAttributes = ['content', 'expand', 'height', 'nohover','speed', 'type'];

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

    this.init();
    this.addDocumentClickHandler();
    this.addListeners();
    this.setHover(!this.nohover);

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
   * Observes menu items for changes.
   * If something is added, check all additions for `<li>` elements.
   * If `<li>` elements are found, for each `<li>` add a label if needed.
   *
   * @param {MutationRecord[]} records  - An array of MutationRecord objects.
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

    this.replaceClassName(this.type);
  }

  /**
   * Initializes the menu based on the `type` attribute.
   */
  init() {
    const lis = this.querySelectorAll('li');

    if (this.type !== 'custom') {
      this.addStyles();
    }

    if (!this.hasAttribute('type')) {
      this.replaceClassName(this.type);
    }

    // this.querySelector('ul', 'menu') sometimes fails
    for (const elem of this.children) {
      if (elem.localName === 'ul' || elem.localName === 'menu') {
        elem.setAttribute('tabindex', '0');
        break;
      }
    }

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
   * Prepend label with checkbox to li element and move li element's first text node into the label.
   *
   * @param {HTMLLIElement} li  - An `<li>` element
   * @returns {HTMLLIElement} The modified `<li>` element.
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
    this.#inputs.add(input);
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
   * Replaces the current menu style class with the  provided class name.
   *
   * @param {string} value  - The new class name for the menu style.
   */
  replaceClassName(value) {
    const elem = this.querySelector('menu, ul');
    if (!elem) return;

    for (const style of WijitMenu.allowed.type) {
      if (style) elem.classList.remove(style);
    }

    if (value) {
      elem.classList.add(value);
      if (value !== 'sitemap' && value !== 'custom') elem.classList.add('default');
    }
  }

  /**
   * Add stylesheet to document head
   */
  addStyles() {
    const style = document.head.querySelector(`#${this.defaultStyleId}`)

    if (!style) document.head.append(this.defaultStyles());
  }

  /**
   * Add event listener to menu. If click target is a link, close the menu.
   */
  addListeners() {
      this.addEventListener('click', event => {
        if (event.target.localName === 'a') this.closeMenu();
        if (event.target.localName === 'label') {
          this.closeAllBut(event.target);
        }
      }, { signal:this.#abortController.signal } );
  }

  /**
   * Add click event listener to document.body. If target is not in the menu, close the menu.
   */
  addDocumentClickHandler() {
    document.body.addEventListener('click', event => {
      if (!!!event.target.closest(this.localName)) {
        this.closeMenu();
      }
    }, { signal:this.#abortController.signal });
  }

  /**
   * Sets all checkboxes in the menu to checked
   */
  expandMenu() {
    for (const input of this.#inputs) {
      input.checked = true;
    }
  }

  /**
   * Sets all checkboxes in the menu to unchecked.
   */
  closeMenu() {
    for (const input of this.#inputs) {
      input.checked = false;
    }
  }

  /**
   * Close everything but `elem`
   * @param  {HTMLElement} elem   - The element whose parent menu to keep open
   */
  closeAllBut(elem) {
    const menu = elem.closest('ul') || elem.closest('menu')
    const open = menu.parentElement.querySelector('input');
    const thisInput = elem.querySelector('input');

    for (const input of this.#inputs) {
      if (input !== open && input !== thisInput) {
        input.checked = false;
      } else if (menu.parentElement === this && input !== thisInput) {
        input.checked = false;
      }
    }
  }

  /**
   * Enable/Disable hovering effects in menus
   * @param {Boolean} value Whether to enable or disable hovering.
   */
  setHover(value) {
    const elem = this.querySelector('ul, menu');
    if (!elem) return;

    if (value) {
      elem.classList.add('hover');
    } else {
      elem.classList.remove('hover');
    }
  }

  /**
   * Logs an error message to the console.
   *
   * @param {string} msg  - The error message.
   * @param {*} value     - The value that caused the error.
   * @memberof WijitMenu
   */
  sendError(msg, value) {
    console.error(`${msg}. Value given was ${value}`);
    return false;
  }

  /**
   * Dispatches a custom event `wijitChanged` with details about the attribute change.
   *
   * @param {string} attr
   * @param {*} oldval
   * @param {*} newval
   */
  sendEvent(attr, oldval, newval) {
    const info = { attr:attr, old:oldval, new:newval };
    const evt = new CustomEvent('wijitChanged', { detail:info });
    window.dispatchEvent(evt);
  }

  /**
   * Menu styes. Used only if this.type !== "custom".
   * @returns {HTMLStyleElement} A `<style>` element.
   */
  defaultStyles() {
    const style = document.createElement('style');
    style.id = this.defaultStyleId;
    style.textContent = `
      @layer wijit-menu {

      wijit-menu {
        --bg1-color: transparent;
        --bg2-color: whitesmoke;
        --bg3-color: white;
        --border-color: silver;
        --hover-bg: linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(0,0,0,0.1));
        --active-bg: linear-gradient(to top, rgba(255,255,255,0.1), rgba(0,0,0,0.1));
        --text-color: rgb(60,60,60);
        --accent: skyblue;
        --height: auto;
        --speed: .5s;

        display: inline-block;
        position: relative;
        width: 100%;
        z-index: 1;
      }

      @media (prefers-color-scheme: dark) {
        wijit-menu {
          --bg1-color: transparent;
          --bg2-color: rgb(60, 60, 60);
          --bg3-color: rgb(40, 40, 40);
          --border-color: dimgray;
          --text-color: rgb(240, 240, 240);
          --accent: dodgerblue;
        }
      }

      @media (pointer: fine) {
        wijit-menu .ribbon.hover li:hover > label input[name="wm-checkbox"],
        wijit-menu .oldschool.hover li:hover > label input[name="wm-checkbox"]
        { transform: rotate(90deg); }

        wijit-menu .ribbon.hover li:has(label):hover > ul,
        wijit-menu .ribbon.hover li:has(label):hover > menu,
        wijit-menu .oldschool.hover li:has(label):hover > ul,
        wijit-menu .oldschool.hover li:has(label):hover > menu
        {
          flex: 1;
          max-height: 200vh;
          overflow: visible;
          z-index: 1;
        }
      }

      @media screen and (max-width: 500px) {
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

        wijit-menu .oldschool li
        { position: static; }

        wijit-menu .oldschool
        { position: relative; }

        wijit-menu .oldschool li > menu,
        wijit-menu .oldschool li > ul
        {
          left: 0;
          top: 100%;
          width: 100%;
        }

        wijit-menu .oldschool menu > li > menu,
        wijit-menu .oldschool ul > li > ul {
          left: 0 !important;
          top: 100% !important;
        }
      }

      @media screen and (min-width: 501px) {
        wijit-menu ul ul,
        wijit-menu menu menu
        { border-radius: 1rem 0 0 1rem; }

        wijit-menu li:first-child
        { border-radius: 1rem 0 0 0; }

        wijit-menu li:last-child
        { border-radius: 0 0 0 1rem; }

        wijit-menu.oldschool li
        { position: relative; }

        wijit-menu.oldschool li > menu,
        wijit-menu.oldschool li > ul {
          top: 0;
          width: max-content;
        }

        wijit-menu.oldschool li li > menu,
        wijit-menu.oldschool li li > ul {
          left: 100%;
          top: 0;
        }
      }

      wijit-menu .default {

      /****** Backgrounds ******/
        background: var(--bg1-color);

        & li > ul,
        & li > menu
        { background: var(--bg2-color) }

        & ul > li > ul,
        & menu > li > menu
        { background: var(--bg3-color) }

        & li:not(:has(input:checked)):hover
        { background: var(--hover-bg); }

        & li:not(:has(input:checked)):active
        { background: var(--active-bg); }

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
        & li,
        & label,
        & input[name="wm-checkbox"]
        { color: var(--text-color) }

        & a:hover,
        & label:hover,
        & label:hover > a,
        & label:hover input[name="wm-checkbox"]
        { color: var(--accent); }

        & a,
        & label,
        & input[name="wm-checkbox"]
        { font-weight: bold; }

        & input[name="wm-checkbox"]
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
        & input[name="wm-checkbox"]
        { cursor: pointer }

      /****** Structure ******/

        width: 100%;
        list-style: none;
        margin: 0;
        padding: 0;

        & a {
          align-content: center;
          text-align: left;
          flex: 1;
          padding: .5rem;
          min-width: max-content;
        }

        & input[name="wm-checkbox"] {
          appearance: none;
          aspect-ratio: 1/1;
          display: inline-block;
          margin: 0 .5rem 0 0;
          position: relative;
          transition: all .25s;
          vertical-align: middle;
          width: 1.5rem;
        }

        & input[name="wm-checkbox"]:checked
        { transform: rotate(90deg); }

        & input[name="wm-checkbox"]:before {
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
          max-height: 200vh;
          z-index: 1;
        }

        & li {
          align-items: normal;
          box-sizing: border-box;
          display: flex;
          min-height: var(--height);
          padding-left: 1rem;
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

      &.inset {

        li > menu,
        li > ul
        { box-shadow: inset 5px 5px 10px rgba(0, 0, 0, 0.5); }

      } /** .inset **/

      &.ribbon {

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
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
          position: relative;

          & a {
            text-align: center;
          }

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
            max-height: 200vh;
            overflow: visible;
            z-index: 1;
          }

          & li {
            flex: 1;
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

      &.oldschool {

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

          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
          position: relative;

          & a {
            text-align: center;
          }

          & label {
            flex: 1;
            justify-content: center;
          }

          & li li label {
            justify-content: start;
          }

          & label:has(input):hover,
          & label:has(input:checked)
          { flex: 1; }

          & label:has(input:checked) + menu,
          & label:has(input:checked) + ul
          {
            flex: 1;
            max-height: 200vh;
            overflow: visible;
          }

          & li {
            flex: 1;
            position: relative;
          }

          & li > menu,
          & li > ul {
            flex-direction: column;
            left: 0;
            overflow: hidden;
            position: absolute;
            top: 100%;
            z-index: 1;
          }

          & menu > li > menu,
          & ul > li > ul {
            top: 0;
            left: 99%;
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

      } /** default **/

      wijit-menu .sitemap {
        --height: var(--height);

        /****** Borders ******/
          border-radius: 0;

          & li,
          & li > ul,
          & li > menu,
          & label > a
          {
            border: none;
            border-radius: 0;
          }

        /****** Text ******/
          & a
          { color: var(--text-color); }

          & a:hover
          { color: var(--accent); }

          & label,
          & label a {
            font-weight: bold;
            font-size: 1.1rem;
          }

          & li:has(label) {
            margin-bottom: 10px;
          }

          & li:has(label) > menu,
          & li:has(label) > ul {
            padding-left: 1rem
          }

        /**** Shadows ****/
          & li > menu,
          & li > ul,
          & a[href]:active
          { box-shadow: none }

        /****** Structure ******/

          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, max-content));
          gap: 1rem;
          list-style: none;
          margin: 0;
          padding: 0;
          width: 100%;

          & input {
            display: none;
          }

          & menu {
            border: 1px dotted var(--border-color);
            display: flex;
            flex-direction: column;
            flex-wrap: wrap;
            gap: .5rem;
            list-style: none;
            margin: 0;
            max-height: var(--height);
            padding: 0;
            width: max-content;
          }

          & menu menu {
              border: none;
          }

          & menu menu menu {
            display: block;
          }
      } /** .sitemap **/

      } /** layer **/
    `;

    return style;
  }

  get content() { return this.#content; }

  set content(value) {
    let item = window;
    let error = false;
    const parts = value.split('.');
    for (const part of parts) {
      try {
        item = item[part];
      } catch {
        error = `window.${value} is undefined`;
      }
    }

    if (error) {
      console.error(error);
    } else {
      for (const li of item.querySelectorAll('li')) {
        if (this.hasChildMenu(li)) {
          if (!this.hasLabel(li)) this.addLabel(li);
        }
      }

      this.append(item.cloneNode(true));
      this.replaceClassName(this.type);
    }
  }

  get expand() { return this.#expand; }

  set expand(value) {
    switch (value) {
      case null:
      case false:
      case 'false':
        value = false;
        break;
      default:
        value = true;
        break;
    }

    this.#expand = value;
    if (value) {
      this.expandMenu();
    } else {
      this.closeMenu();
    }
  }

  get height() { return this.#height; }

  set height(value) {
    this.#height = value;
    this.style.setProperty('--height', value);
  }

  get nohover() { return this.#nohover; }

  set nohover(value) {
    switch (value) {
      case null:
      case false:
      case "false":
        value = false;
        break;
      default:
        value = true;
        break;
    }

    this.#nohover = value;
    this.setHover(!value);
  }

  get speed() { return this.#speed; }

  set speed(value) {
    if (/\d+$/.test(value)) value += 's';
    this.#speed = value;
    this.style.setProperty('--speed', value);
  }

  get type() { return this.#type; }

  set type(value) {
    this.#type = value;
    this.replaceClassName(value);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!customElements.get('wijit-menu')) {
    customElements.define('wijit-menu', WijitMenu);
  }
});
