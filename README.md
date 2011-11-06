### Build tool for JavaScript

My own attempt at creating a build tool for linking with source files (after recursively building them, if needed).

In it's present state, it only creates symlinks to files pointed at in a 'build.json' file.

#### Format of a build.json file:

    {
      "targetname": {
        "srcs": [...],
        "deps": [...],
        "to": {
          "dir": "...",
          "copy": true|false
        }
      },
      "othertarget": {...}
    }

#### Example of a build.json file

    {
      "test": {
        "srcs": ["test.js"],
        "deps": ["//javascript/namespace:namespace.js",
                 "//javascript/array+clean:array+clean.js",
                 "//javascript/date/build:date.js"],
        "to": {
          "dir": "./lib",
          "copy": false
        }
      }
    }

Run using `$ build test`

#### Improvements

This is just the very first try. It can be massively improved for things like compiling sources, recursively building dependencies, integrating with other build tools like jake (which I hope will be possible).

#### Why do this?

Over the past four years, I have installed so many different libraries that after reorganizing all this source code along with libs I made myself, I needed a way to be able to load in any of these libraries whenever I want.
