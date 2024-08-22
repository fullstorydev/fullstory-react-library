# base-react-component-library

Hi this is a base project for a react component library. This project is meant to have all of the simple things you need to start a new react component library.

## Get Started

1. Run `npm install`
2. In package.json update `name` to the name of your library
3. Update registery in publishConfig like this `https://npm.pkg.github.com/<GITHUB_ACCOUNT_NAME>`
4. create a `.npmrc` file that looks something like this

    ```
    registry=https://registry.npmjs.org/
    //npm.pkg.github.com/:<AUTH_TOKEN>
    @<GITHUB_ACCOUNT_NAME>:registry=https://npm.pkg.github.com
    ```

5. Run `npm run rollbar`
6. Run `npm publish --access public`
