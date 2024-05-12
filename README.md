# Wijit-Menu Web Component
** A web component that displays a menu in various styles from a user-provided `menu` or `ul` list.**

## Features

- Converts a plain `ul` or `menu` list into an expandable, hoverable, responsive HTML menu.
- Choose from four different menu styles or use your own css to style the menu how you want.
- Easily change several aspects of the menu's appearance and behavior.

## Usage

Include the script tag. Make sure to include `type="module"`

    <script type="module" src="wijit-menu.min.js"></script>

Add the tag(s) where you want your menu

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
        <li>
          <a href="#">Foo</a>
        </li>
        <li>
          Bar
          <menu>
            <li>
              <a href="#">Baz</a>
            </li>
            <li>
              <a href="#">Boom</a>
            </li>
          </menu>
        </li>
      </menu>
    </wijit-menu>

## Attributes

### expand (default: false)

**Allowed values:** [null, "", "true", true, "false", false]

This is a convenience feature for when you are working on your menu. It expands all levels so you can see everything at once.

    <!-- Example -->
    <wijit-Menu expand>...</wijit-menu>

### type (default: "default")

**Allowed values:** ["default", "ribbon", "oldschool", "sitemap"]

This determines what type of menu to display.

    <wijit-menu type="ribbon">...</wijit-menu>

### height (default: "auto")

**Allowed values:** Any valid css `length` value EXCEPT percentages.

This influences the height of each `<li>` element in the menu. It the menu is a "sitemap", it influences the height of the whole menu. The actual height of the menu may not necessarily match this value. Please test your design thoroughly.

### speed (default: ".5s")

**Allowed values:** Integers and any valid css `transition-duration` value.

This determines the duration of the transitions.

## CSS Custom Properties

There are a number of custom css properties which make it easier for you to change some basic aspects of the menu's appearance. Some of these properties have analogs among the available attributes. In such cases, the attribute usually takes precendence over the css property.

You should apply these properties to the `wijit-code` element in your css.

    /* Example */
    wijit-code {
      --bg1-color: transparent;
      --bg2-color: whitesmoke;
      --border-color: silver;
      --text-color: rgb(60,60,60);
      --accent: skyblue;
      --menu-height: auto;
      --speed: .75s;
    }

    @media (prefers-color-scheme: dark) {
      wijit-menu {
        --bg1-color: transparent;
        --bg2-color: rgb(60, 60, 60);
        --border-color: dimgray;
        --text-color: rgb(240, 240, 240);
        --accent: dodgerblue;
      }
    }

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

### --border-color

**Allowed values:** Any valid css color value.

This determines the color of all visible borders.

### --text-color

**Allowed values:** Any valid css color value

This determines the color of all text

### --accent

**Allowed values:** Any valit css color value.

This determines the color of hover and click effects.1


