# Wijit-Menu Web Component
**A web component that displays a menu in various styles from a user-provided `menu` or `ul` list.**

Demo: https://holmesbryant.github.io/wijit-menu/

## Features

- Converts a plain `ul` or `menu` list into an expandable, hoverable, responsive HTML menu.
- Choose from four different menu styles or use your own css to style the menu how you want.
- Easily change several aspects of the menu's appearance and behavior.
- Does not make use of a Shadow DOM. Your menu remains in the Light DOM.

**Note** Although this component can handle lists with more than three levels, the default css styles are only designed for lists with three or fewer levels. If you have deeply nested lists, you may have to write your own css styles. You can use your own css by setting the `type` attribute to "custom".

## Usage

Include the script tag. Make sure to include `type="module"`


    <script type="module" src="wijit-menu.min.js"></script>


Add the tag(s) where you want your menu(s)

    <body>
      <header>
        <h1>Welcome!</h1>
        <nav>
          <wijit-menu>...</wijit-menu>
        </nav>
      </header>
      <main>
        <p>Lorem ipsum....</p>
      </main>
    </body>


Add a `<menu>` or `<ul>` list inside the tags.


    <wijit-menu>
      <menu>
        <li> <a href="#">Foo</a> </li>
        <li> Bar
          <menu>
            <li> <a href="#">Baz</a> </li>
            <li> <a href="#">Boom</a> </li>
          </menu>
        </li>
      </menu>
    </wijit-menu>


**Important** Do not mix `<ul>` and `<menu>` in the same list. Use either `<ul>` OR `<menu>` for the whole list.

## Attributes

### expand (default: false)

**Allowed values:** [null, "", "true", true, "false", false]

This is a convenience feature for when you are working on your menu. It expands all levels so you can see everything at once.


    <wijit-Menu expand>...</wijit-menu>


### type (default: "default")

**Allowed values:** ["custom", "default", "ribbon", "oldschool", "sitemap"]

This determines what type of menu to display. If the value is "custom", no css styles will be applied, allowing you to provide your own styles.


    <wijit-menu type="ribbon">...</wijit-menu>


### height (default: "auto")

**Allowed values:** Any valid css `length` value EXCEPT percentages.

This influences the height of each `<li>` element in the menu. If the menu is a "sitemap", it influences the height of each submenu EXCEPT in cases where the sitemap is inside a grid or flex container. If the sitemap is inside a grid or flex container, it is highly likely that this attribute will have no effect. The actual height of the menu may not necessarily match this value. Please test your design thoroughly.


### speed (default: ".5s")

**Allowed values:** Integers and any valid css `transition-duration` value.

This determines the duration of the transitions.


## CSS Custom Properties

There are a number of custom css properties which make it easier for you to change some basic aspects of the menu's appearance.

You should apply these properties to the `wijit-code` element in your css styles.


    /* Default Values */
    wijit-code {
      --bg1-color: transparent;
      --bg2-color: whitesmoke;
      --bg3-color: white;
      --hover-bg: linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(0,0,0,0.1));
      --active-bg: linear-gradient(to top, rgba(255,255,255,0.1), rgba(0,0,0,0.1));
      --border-color: silver;
      --text-color: rgb(60,60,60);
      --accent: skyblue;
      --menu-height: auto;
      --speed: .5s;
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


Some of these properties have analogs among the available attributes. In such cases, the attribute applies its value to the same css property. This means that specificity matters. It also means that whichever attribute/css property was invoked last takes precedence.

You could, for example, define a global css property in your styles that affects most menus, and then add the corresponding attribute to a specific menu to affect only that menu.


    <style>
      wijit-menu { --height: auto; }
      wijit-menu.big { --height: 100px; }
    </style>
    ...
    <body>
      <wijit-menu>
        <menu>
          <li>This height will be "auto"</li>
        </menu>
      </wijit-menu>
      <wijit-menu class="big">
        <menu>
          <li>This height will be "100px"</li>
        </menu>
      </wijit-menu>
      <wijit-menu height="4rem">
        <menu>
          <li>This height will be "4rem"</li>
        </menu>
      </wijit-menu>


### --height

See the "height" attribute


### --speed

See the "speed" attribute


### --bg1-color

**Allowed values:** Any valid css color value

This determines the background color of the main menu.


### --bg2-color

**Allowed values:** Any valid css color value

This determines the background color of primary and tertiary submenus.


### --bg3-color

**Allowed values:** Any valid css color value

This determines the background color of secondary submenus.


### --hover-bg

**Allowed values:** Any valid css color value

This determines the background color of the item the mouse is hovering over.


### --active-bg

**Allowed values:** Any valid css color value

This determines the background color of the item the user is clicking on.


### --border-color

**Allowed values:** Any valid css color value.

This determines the color of all visible borders.


### --text-color

**Allowed values:** Any valid css color value

This determines the color of all text


### --accent

**Allowed values:** Any valid css color value.

This determines the color of hover and click effects.


