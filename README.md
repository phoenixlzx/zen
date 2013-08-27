### Zen

Zen is a blog app using Node.js & MongoDB, inspired by [yang6233562/y](https://github.com/yang6233562/y).

Demo: [Zenblog](http://zen.phoenixlzx.com:3000)

#### Usage

1. Install Node.js & MongoDB on your server. Note: Install Node.js via [visionmedia/n](https://github.com/visionmedia/n) is recommended, as some distro have old Nodejs versions.

2. `git clone https://github.com/phoenixlzx/zen.git && cd zen && npm install`

3. Edit `config.js.example` and rename to `config.js`

4. `node app.js`

5. Done!

**ATTENTION** : You **MUST** leave `allowReg` to `true` before you register at least 1 user. You could set it to `false` after you have successfully registered and then reload the app.
Usable translation: see `i18n` directory.

#### TODO

- Better theme support (and more themes!) [IN-PROGRESS]
- <del>Validate user inputs using node-validator</del> [DONE]
- Password recovery
- <del>Edit user information</del> [DONE]
- <del>Split tags by ','</del> [DONE]
- <del>i18n</del> [DONE] - More translations needed! See instructions below.
- Email support
- Store site-relative configurations in database / JSON file, in order to have a site settings page.
- Hash password using time criteria at client side to some how avoid Man-In-Middle attacks
- Draft support
- <del>Edit/delete support</del> [DONE]

#### Contribute

##### Translate

I hope this project can be available to the massive. Translation works need less knowledge of programming so most people can do this.

Our translation is hosted on [Transifex](https://www.transifex.com/projects/p/zen/), feel free to join us or request new translate team if you want to contribute.

**Current translators (ordered by submit time, special thanks to them!) :**

- en-us & zh-cn: myself.
- zh-tw: @bcbcarl
- vi: @bizover
- ja-jp: @lexdene
- tr: @bbuyukguzel

##### Code

Pull requests are always welcome. 

Any help -- a better/simpler way to implement the function, bug report, new idea, new theme.. etc, will be appreciated.

#### License

(The MIT License)

Copyright (c) 2013 Phoenix Nemo <i@phoenixlzx.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.