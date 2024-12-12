# Fullstory React Library

This is a component library that encourages developers to build with components suped up with Fullstory functionality.

## Installation

Run `npm install @fullstory/react-library`

## Page Names and Properties

### 1. Defualt Configuration

The defualt configuration will capture all of the information in the url, meta tags, and schemas. The page name by default comes from the url path.

**Implementation:**

Wrap your Routes with `<FullStoryProvider>` like so

```
import { FullStoryProvider } from "@fullstory/react-library";

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

### 2. Url Configuration

The url configuration will set page names and properties according to the url. It will set configure the pageName from the path and properties from the search.

**Implementation:**

Add the capture rule of `url` to your `FullStoryProvider`.

```
import { FullStoryProvider } from "@fullstory/react-library";

const App = () => {
  return (
    <FullStoryProvider defaultCapture={["url"]}>
      <Routes>
        {...}
      </Routes>
    </FullStoryProvider>
  )
}
```

### 3. Meta Configuration

The meta configuration will capture all of the information in the meta tags. It will configure the pageName from the title tag in the head.

**Implementation:**

Add the capture rule of `meta` to your `FullStoryProvider`.

```
import { FullStoryProvider } from "@fullstory/react-library";

const App = () => {
  return (
    <FullStoryProvider defaultCapture={["meta"]}>
      <Routes>
        {...}
      </Routes>
    </FullStoryProvider>
  )
}

```

### 4. Schema Configuration

The schema configuration will capture all of the information in the schemas on the page. It will configure the pageName from the url path.

**Implementation:**

Add the capture rule of `schema` to your `FullStoryProvider`.

```
import { FullStoryProvider } from "@fullstory/react-library";

const App = () => {
  return (
    <FullStoryProvider defaultCapture={["schema"]}>
      <Routes>
        {...}
      </Routes>
    </FullStoryProvider>
  )
}

```

### 5. Multi Capture Configuration

Multi Capture Configuration will by defualt capture information from certain aspects of the page.

**Implementation:**

Add the capture rules you would like to your `FullStoryProvider`.

```
import { FullStoryProvider } from "@fullstory/react-library";

const App = () => {
  return (
    <FullStoryProvider defaultCapture={["url", "schema"]}>
      <Routes>
        {...}
      </Routes>
    </FullStoryProvider>
  )
}

```

### 6. Singular Page Capture Rules

Additionally, we can overried the default capture rules by adding capture rules to specific pages.

**Implementation:**

Add the capture rules by defining the page and the rule you expect to `FullStoryProvider`.

```
import { FullStoryProvider } from "@fullstory/react-library";

const App = () => {
  return (
    <FullStoryProvider defaultCapture={["url"]} pageCaptureRules={{"dashboard": ["schema", "meta"]}}>
      <Routes>
        <Route path="/" element={<HomePage />}/>
        <Route path="/dashboard" element={<Dashboard />}/>
      </Routes>
    </FullStoryProvider>
  )
}

```

### 7. useFSNavigate Configuration

If you would like FullStory to capture custom pagenames and properties we can use the hook `useFSNavigate()`. The page name will be set to your custom pagename and the custom properties will be added to the properties captured by the default configuration or page configuration rules.

**Implementation:**

```
import { FullStoryProvider } from "@fullstory/react-library";

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
import { useFSNavigate } from "@fullstory/react-library";

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
