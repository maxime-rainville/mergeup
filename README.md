# mergeup

Simple script that goes through the dependency of a Silverstripe CMS project to see what needs to be merged up for each repo.

You can run this on a Silverstripe Installer or CWP Kitchen sink project. You need to make sure your project was isntalled with the `--prefer-source` composer flag.

# Usage
Clone the project and build locally. The entry point will be in `build/main/index.js`. `cd` into your Silverstripe CMS Project root and call the mergeup entry point.

```bash
node ~/path/to/build/main/index.js
```

mergeup will:
* find all the module repos in `vendor/dnadesign`, `vendor/silverstripe` and `vendor/cwp`
* for each module
  * it will identify what the main release line is
  * find what other branches exists for this release line
  * compare each branch to the next sequential one to see if any commits are missing


# Sample output
```md
# vendor/silverstripe/asset-admin
* origin/1.3..origin/1.2: all up-to-date
* origin/1.4..origin/1.3: all up-to-date
* origin/1.5..origin/1.4
  * Dylan Wagstaff - Merge pull request #1031 from tractorcow/pulls/1.4/dist-images-missing
  * Maxime Rainville - BUG Update build script to copy images to dist folder
  * Damian Mooyman - BUG Fix missing dist images Fixes #953
* origin/1..origin/1.5
  * Garion Herman - Merge pull request #1052 from lpostiglione/patch-1
  * Luca Postiglione - implode in _t() breaks i18nTextCollectorTask
  * Garion Herman - Merge pull request #1055 from creative-commoners/pulls/1.5/remote-file-image-size
  * Steve Boyd - BUG do not render ImageSizePresentList react component for remote files

# vendor/silverstripe/recipe-form-building
* origin/1.1..origin/1.0: all up-to-date
* origin/1.2..origin/1.1: all up-to-date
* origin/1.3..origin/1.2: all up-to-date
* origin/1.4..origin/1.3: all up-to-date
* origin/1.5..origin/1.4: all up-to-date
* origin/1..origin/1.5
  * Garion Herman - Update development dependencies
  * Garion Herman - Update Composer / Travis config to CMS 4.5 series

...
```

