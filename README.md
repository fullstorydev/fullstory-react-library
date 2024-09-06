# fs-react-component-library

This is a component library that encourages developers to build with components suped up with Fullstory functionality.

## Installation

Run `npm install @bateman001/fs-react-component-library`

## Page Names and Properties

### 1. Auto Configuration

Wrap your Routes with `<FullStoryProvider>` like so

```
import { FullStoryProvider } from "@bateman001/fs-react-component-library";

const App = () => {
  return (
    <FullStoryProvider>
      <Routes>
        {...}
      </Routes>
    </FullStoryProvider>
  )
}
```

### 2. Meta Configuration

If you would like FullStory to capture the properties in your meta tags instead of your URL use the tag `meta` in `<FullStoryProvider/>` like this:

```
import { FullStoryProvider } from "@bateman001/fs-react-component-library";

const App = () => {
  return (
    <FullStoryProvider meta>
      <Routes>
        {...}
      </Routes>
    </FullStoryProvider>
  )
}

```

### 3. useFSNavigate Configuration

If you would like FullStory to capture custom pagenames and properties we can use the hook `useFSNavigate()`. We must first implement our `<FullStoryProvider/>` like this.

```
import { FullStoryProvider } from "@bateman001/fs-react-component-library";

const App = () => {
  return (
    <FullStoryProvider>
      <Routes>
        {...}
      </Routes>
    </FullStoryProvider>
  )
}
```

Then we can use the hook anywhere within the provider like this:

```
import { useFSNavigate } from "@bateman001/fs-react-component-library";

const Button = (props) => {
  const { property } = props
  const nav = useFSNavigate()

  return (
    <button onClick={() => nav("/", "Home Page", {property_1: property})}>
      Home Page
    </button>
  )
}
```
