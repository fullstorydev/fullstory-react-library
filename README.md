# Fullstory React Library

This is a component library that encourages developers to build with components suped up with Fullstory functionality.

## Installation

```bash
npm install @fullstory/react-library
```

### Peer Dependencies

This library requires the following peer dependencies:

- `react` v18 or v19
- `react-router` v6+
- `@fullstory/browser` v2+

## Migration Guide

### v1 → v2: `react-router-dom` → `react-router`

**v2 is a breaking change** for apps on React Router v5 or earlier.

**What changed:** The peer dependency was updated from `react-router-dom` to `react-router` to align with the package structure introduced in React Router v6, where core routing APIs live in `react-router` and `react-router-dom` is a thin DOM-specific wrapper.

**Required minimum version:** React Router v6.

**If you are on React Router v6:** No changes needed beyond upgrading this library. `react-router-dom` re-exports everything from `react-router`, so your existing app imports are unaffected.

**If you are on React Router v5:** Install the [React Router v5→v6 compatibility layer](https://github.com/remix-run/react-router/tree/main/packages/react-router-dom-v5-compat) to migrate incrementally before upgrading to v2 of this library.

## Page Names and Properties

### 1. Default Configuration

The default configuration will capture all of the information in the url, meta tags, and schemas. The page name by default comes from the url path.

**Implementation:**

Wrap your Routes with `<FullStoryProvider>` like so

```jsx
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

```jsx
import { FullStoryProvider } from "@fullstory/react-library";

const App = () => {
  return (
    <FullStoryProvider defaultCaptureRules={["url"]}>
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

```jsx
import { FullStoryProvider } from "@fullstory/react-library";

const App = () => {
  return (
    <FullStoryProvider defaultCaptureRules={["meta"]}>
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

```jsx
import { FullStoryProvider } from "@fullstory/react-library";

const App = () => {
  return (
    <FullStoryProvider defaultCaptureRules={["schema"]}>
      <Routes>
        {...}
      </Routes>
    </FullStoryProvider>
  )
}

```

### 5. Multi Capture Configuration

Multi Capture Configuration will by default capture information from certain aspects of the page.

**Implementation:**

Add the capture rules you would like to your `FullStoryProvider`.

```jsx
import { FullStoryProvider } from "@fullstory/react-library";

const App = () => {
  return (
    <FullStoryProvider defaultCaptureRules={["url", "schema"]}>
      <Routes>
        {...}
      </Routes>
    </FullStoryProvider>
  )
}

```

### 6. Singular Page Capture Rules

Additionally, we can override the default capture rules by adding capture rules to specific pages.

**Implementation:**

Add the capture rules by defining the page and the rule you expect to `FullStoryProvider`.

```jsx
import { FullStoryProvider } from "@fullstory/react-library";

const App = () => {
  return (
    <FullStoryProvider defaultCaptureRules={["url"]} pageCaptureRules={{"dashboard": ["schema", "meta"]}}>
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

```jsx
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

```jsx
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
