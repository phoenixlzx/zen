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

**ATTENTION** You **MUST** leave `allowReg` to `true` before you register at least 1 user. You could set it to `false` after you have successfully registered and restart the app.


#### TODO

- Better theme support (and more themes!) [IN-PROGRESS]
- Validate user inputs using node-validator
- Password recovery
- <del>Split tags by ','</del> [DONE]
- i18n
- Email support
- Store site-relative configurations in database / JSON file, in order to have a site settings page.
- Hash password using time criteria at client side to some how avoid Man-In-Middle attacks
- Draft support
- Edit/delete support [DONE]
- List posts under each tag in Tags page
