 // import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

function updateCodeExample(elem, target) {
  const clone = elem.cloneNode();
  clone.removeAttribute('style');
  let cloneStr = clone.outerHTML;
  cloneStr = cloneStr.substr(0, cloneStr.indexOf('</wijit-reveal>'));
  const iconStr = elem.children[1]? elem.children[1].outerHTML : '';
  const str = `
  ${cloneStr}
    ${iconStr}
  `;
  target.textContent = str;
}

function change(evt, attr) {
  const demo = document.querySelector('#demo');
  if (!demo) return;

  const code = document.querySelector('#demo-changes');

  let value = evt.target.value;

  if (evt.target.type && evt.target.type === 'checkbox') {
    value = (event.target.checked) ? 'true' : 'false';
  }

  if ( attr.startsWith( '--' ) ) {
    demo.style.setProperty(attr, value);
  } else {
    demo.setAttribute( attr, value );
  }

  updateCodeExample(demo, code);
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
