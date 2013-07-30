### Zen

Zen is a blog app using Node.js & MongoDB, inspired by [yang6233562/y](https://github.com/yang6233562/y).

Pull requests are welcome!

Demo: [Zenblog](http://zen.phoenixlzx.com:3000)

#### Usage

1. Install Node.js & MongoDB on your server. Note: Install Node.js via [visionmedia/n](https://github.com/visionmedia/n) is recommended, as some distro have old Nodejs versions.

2. `git clone https://github.com/phoenixlzx/zen.git && cd zen && npm install`

3. Edit config.js

4. `node app.js`

5. Done!

**ATTENTION** 
You **MUST** leave `allowReg` to `true` before you register at least 1 user. You could set it to `false` after you have successfully registered and restart the app.


#### TODO

- Better theme support (and more themes!) [IN-PROGRESS]
- <del>Validate user inputs using node-validator</del> [DONE]
- Password recovery
- <del>Split tags by ','</del> [DONE]
- <del>i18n</del> [DONE] - More translations needed! See json files in `i18n`
- Email support
- Store site-relative configurations in database / JSON file, in order to have a site settings page.
- Hash password using time criteria at client side to some how avoid Man-In-Middle attacks
- Draft support
- <del>Edit/delete support</del> [DONE]
- List posts under each tag in Tags page

#### License

(The MIT License)

Copyright (c) 2013 Phoenix Nemo <mrphoenixlzx@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.