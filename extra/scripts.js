 // import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

/**
 * Update code sample in `target` to match changes in `elem`
 * @param  {HTMLElement} elem   The element being watched for changes.
 * @param  {HTMLElement} target The element which holds the example code.
 * @return {[type]}        [description]
 */
function updateCodeExample(elem, target, tagname) {
  const closeTag = `</${tagname}>`;
  const clone = elem.cloneNode();
  clone.removeAttribute('style');
  let cloneStr = clone.outerHTML;
  cloneStr = cloneStr.substr(0, cloneStr.indexOf(closeTag));
  const iconStr = elem.children[1]? elem.children[1].outerHTML : '';

  const str = `
  ${cloneStr}
    ${iconStr}
  `;
  target.textContent = str;
}

/**
 * Changes property, attribute and css property values on demo element
 * @param  {Event} evt  The event that triggered the update
 * @param  {string} attr The attribute, property or css property name
 */
function change(evt, attr) {
  const demo = document.querySelector('#demo');
  // console.log(evt, attr);
  // console.log(demo);
  if (!demo) return;

  const code = document.querySelector('#demo-changes');
  let value = evt.target.value;

  if (evt.target.type && evt.target.type === 'checkbox') {
    value = (event.target.checked) ? true : false;
    if (value) {
      demo.setAttribute(attr, value);
    } else {
      demo.removeAttribute(attr);
    }
  } else if ( attr.startsWith( '--' ) ) {
    demo.style.setProperty(attr, value);
  } else {
    demo.setAttribute( attr, value );
  }

    // console.log(attr, value, demo);
  if (code) updateCodeExample(demo, code, demo.localName);
}

/**
 * Grab the README file and stick it in the "instructions" container
 */
function getReadme () {
  const elem = document.querySelector('details#instructions > div');
  fetch ('./README.md')
  .then (response => response.text())
  .then (text => {
    elem.textContent = text;
    return text
  })
  .then (text => {
    // const timer = setInterval(() => {
      const isLoaded = (typeof marked === 'undefined') ? false : true;
      if (isLoaded) {
        // clearInterval(timer);
        elem.innerHTML = marked.parse(text);
      }
    // }, 500)
  });
}

getReadme();
window.change = change;
