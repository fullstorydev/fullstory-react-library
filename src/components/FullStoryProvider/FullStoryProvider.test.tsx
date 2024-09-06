import React from "react";
import { render, screen, act } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { MemoryRouter } from "react-router"; // MemoryRouter is useful for testing
import FullStoryProvider from "./FullStoryProvider";
import * as FS from "../../utils/fullstory";
import * as Helpers from "../../utils/helpers";
import { FullStory, init } from "@fullstory/browser";
import { FullStoryContext } from "./FullStoryContext";

jest.mock("@fullstory/browser", () => ({
    FullStory: jest.fn((apiName, options) => {
        // Here you can add a condition to handle different FullStory API names if necessary
        if (apiName === "setProperties") {
            return;
            // You could add additional logic to save the data or validate the options
            // For now, we'll just check that it's been called correctly.
        }
    }),
    init: jest.fn(org_id => {
        console.log("org_id", org_id);
    })
}));

describe("FullStoryProvider: Auto Configure", () => {
    // Define a simple test component for the route
    const TestComponent = () => <div>Test Component</div>;
    const getNameSpy = jest.spyOn(Helpers, "getPageName");
    const getPropertiesSpy = jest.spyOn(Helpers, "getSearchProperties");
    const setPropertiesSpy = jest.spyOn(FS, "setPage");

    beforeAll(() => {
        init({ orgId: "123" });
        //@ts-ignore
        delete window.location;
    });

    it("renders with FSProvider", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");
        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(screen.getByText("Test Component"));
    });

    // GET PAGE NAME
    it("getPageName returns correct path name", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getNameSpy).toHaveBeenCalledWith("/test-path", false);
        expect(getNameSpy).toHaveLastReturnedWith("Test-path");
    });

    it("getPageName returns correct path name for multi path", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path/menu");

        render(
            <MemoryRouter initialEntries={["/test-path/menu"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path/menu" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getNameSpy).toHaveBeenCalledWith("/test-path/menu", false);
        expect(getNameSpy).toHaveLastReturnedWith("Test-path / Menu");
    });

    it("handles navigation events", () => {
        // Set up initial location

        //@ts-ignore
        window.location = new URL("http://example.com/test-path/menu");

        // Mock and spy on the global window object
        jest.spyOn(window, "addEventListener");
        jest.spyOn(window, "removeEventListener");

        // Render the provider
        render(
            <FullStoryProvider>
                <TestComponent />
            </FullStoryProvider>
        );

        // Simulate navigation by changing location and dispatching a popstate event
        //@ts-ignore
        window.location = new URL("http://example.com/new-path");
        window.dispatchEvent(new PopStateEvent("popstate"));

        expect(setPropertiesSpy).toHaveBeenCalled(); // or expect(setPage).toHaveBeenCalledWith(...)
    });

    // GET SEARCH PROPS
    it("getSearchProperties returns properties from search", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?property-1=1&property-2=property");

        render(
            <FullStoryProvider>
                <TestComponent />
            </FullStoryProvider>
        );

        expect(getPropertiesSpy).toHaveBeenCalledWith("?property-1=1&property-2=property", false);
        expect(getPropertiesSpy).toHaveLastReturnedWith({ property_1: 1, property_2: "property" });
    });

    it("getSearchProperties returns object when search is empty", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPropertiesSpy).toHaveBeenCalledWith("", false);
        expect(getPropertiesSpy).toHaveLastReturnedWith({});
    });

    it("getSearchProperties gets property with space delimeter", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?name=John%20Doe&property-2=property");

        render(
            <MemoryRouter initialEntries={["/test-path?name=John%20Doe&property-2=property"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPropertiesSpy).toHaveBeenCalledWith("?name=John%20Doe&property-2=property", false);
        expect(getPropertiesSpy).toHaveLastReturnedWith({ name: "John Doe", property_2: "property" });
    });

    it("getSearchProperties gets property with multiple - ", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path/?user-property-1=property");

        render(
            <MemoryRouter initialEntries={["/test-path?user-property-1=property"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPropertiesSpy).toHaveBeenCalledWith("?user-property-1=property", false);
        expect(getPropertiesSpy).toHaveLastReturnedWith({ user_property_1: "property" });
    });

    // SET SEARCH PROPS
    it("setProperties sets with no search items", () => {
        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(setPropertiesSpy).toHaveBeenCalledWith("Test-path", {});

        expect(FullStory).toHaveBeenCalledWith("setProperties", {
            type: "page",
            properties: {
                pageName: "Test-path"
            }
        });
    });

    it("setProperties sets with search items", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?property-1=1&property-2=property");

        render(
            <MemoryRouter initialEntries={["/test-path?property-1=1&property-2=property"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(setPropertiesSpy).toHaveBeenCalledWith("Test-path", {});

        expect(FullStory).toHaveBeenCalledWith("setProperties", {
            type: "page",
            properties: {
                pageName: "Test-path",
                property_1: 1,
                property_2: "property"
            }
        });
    });
});

describe("FullStoryProvider: Meta Configure", () => {
    beforeAll(() => {
        init({ orgId: "123" });
        //@ts-ignore
        delete window.location;

        document.head.innerHTML = `
        <title>Test Component</title>
        <meta name="description" content="Test Description">
        <meta name="keywords" content="jest,testing">
        <meta property="og:title" content="Test Title">
      `;
    });

    const TestComponent = () => <div>Test Component</div>;
    const getSearchProperties = jest.spyOn(Helpers, "getSearchProperties");
    const getPageNameSpy = jest.spyOn(Helpers, "getPageName");

    it("renders with FSProvider with meta tag", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider meta>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(screen.getByText("Test Component"));
    });

    it("calls functions with meta tag called", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider meta>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPageNameSpy).toHaveBeenCalledWith("/test-path", true);
        expect(getSearchProperties).toHaveBeenCalledWith("", true);
    });

    it("is able to extract meta properties from head", () => {
        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider meta>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPageNameSpy).toHaveReturnedWith("Test Component");
        expect(getSearchProperties).toHaveReturnedWith({
            description: "Test Description",
            keywords: "jest,testing",
            "og:title": "Test Title"
        });
    });

    it("is able to set meta properties in FS", () => {
        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider meta>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(FullStory).toHaveBeenCalledWith("setProperties", {
            type: "page",
            properties: {
                pageName: "Test Component",
                description: "Test Description",
                keywords: "jest,testing",
                "og:title": "Test Title"
            }
        });
    });

    it("is able to set meta properties on navigate", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <FullStoryProvider meta>
                <TestComponent />
            </FullStoryProvider>
        );
        expect(getPageNameSpy).toHaveBeenCalledWith("/test-path", true);
        expect(getSearchProperties).toHaveBeenCalledWith("", true);

        document.head.innerHTML = `
        <title>New Component</title>
        <meta name="description" content="New Description">
        <meta name="keywords" content="jest,testing">
        <meta property="og:title" content="New Title">
      `;

        // Simulate navigation by changing location and dispatching a popstate event
        //@ts-ignore
        window.location = new URL("http://example.com/new-path");
        window.dispatchEvent(new PopStateEvent("popstate"));

        expect(getPageNameSpy).toHaveBeenCalledWith("/new-path", true);
        expect(getSearchProperties).toHaveBeenCalledWith("", true);
    });
});

describe("FullStoryProvider: useFSNavigate", () => {
    const TestComponent = () => {
        const { useFSNavigate } = React.useContext(FullStoryContext);

        // Simulate calling useFSNavigate on mount
        React.useEffect(() => {
            act(() => {
                useFSNavigate("/new-path", "Custom Page Name", { prop1: "value1" });
            });
        }, [useFSNavigate]);

        return null; // This component doesn't need to render anything
    };

    const NewComponent = () => <div>New Component</div>;

    const setPropertiesSpy = jest.spyOn(FS, "setPage");

    it("can navigate using useFSNavigate", () => {
        render(
            <FullStoryProvider>
                <TestComponent />
            </FullStoryProvider>
        );

        // Assert that setPage was called with the correct arguments
        expect(setPropertiesSpy).toHaveBeenCalledWith("Custom Page Name", { prop1: "value1" });
    });

    it("can navigate using useFSNavigate within a BrowserRouter", () => {
        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider meta>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                        <Route path="/new-path" element={<NewComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Assert that setPage was called with the correct arguments
        expect(setPropertiesSpy).toHaveBeenCalledWith("Custom Page Name", { prop1: "value1" });
    });
});
