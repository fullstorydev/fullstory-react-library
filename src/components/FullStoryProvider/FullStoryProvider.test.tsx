import React from "react";
import { render, screen, act } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { MemoryRouter } from "react-router"; // MemoryRouter is useful for testing
import FullStoryProvider from "./FullStoryProvider";
import * as FS from "../../utils/fullstory";
import * as Helpers from "../../utils/helpers";
import { FullStory, init } from "@fullstory/browser";
import { FullStoryContext } from "./FullStoryContext";
import { Schema } from "./types";

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
    const setPageSpy = jest.spyOn(FS, "setPage");

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

        expect(getNameSpy).toHaveBeenCalledWith("/test-path", "url", {});
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

        expect(getNameSpy).toHaveBeenCalledWith("/test-path/menu", "url", {});
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

        expect(setPageSpy).toHaveBeenCalled();
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

        expect(getPropertiesSpy).toHaveBeenCalledWith("/test-path", "?property-1=1&property-2=property", "url", {});
        expect(getPropertiesSpy).toHaveLastReturnedWith({
            pageName: "Test-path",
            property_1: 1,
            property_2: "property"
        });
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

        expect(getPropertiesSpy).toHaveBeenCalledWith("/test-path", "", "url", {});
        expect(getPropertiesSpy).toHaveLastReturnedWith({ "pageName": "Test-path" });
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

        expect(getPropertiesSpy).toHaveBeenCalledWith("/test-path", "?name=John%20Doe&property-2=property", "url", {});
        expect(getPropertiesSpy).toHaveLastReturnedWith({
            pageName: "Test-path",
            name: "John Doe",
            property_2: "property"
        });
    });

    it("getSearchProperties gets property with multiple - ", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?user-property-1=property");

        render(
            <MemoryRouter initialEntries={["/test-path?user-property-1=property"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPropertiesSpy).toHaveBeenCalledWith("/test-path", "?user-property-1=property", "url", {});
        expect(getPropertiesSpy).toHaveLastReturnedWith({ pageName: "Test-path", user_property_1: "property" });
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

        expect(setPageSpy).toHaveBeenCalledWith({ pageName: "Test-path" });

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

        expect(setPageSpy).toHaveBeenCalledWith({ pageName: "Test-path", property_1: 1, property_2: "property" });

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

describe("FullStoryProvider: Schema Configure", () => {
    beforeAll(() => {
        init({ orgId: "123" });
        //@ts-ignore
        delete window.location;

        document.head.innerHTML = `
        <script type="application/ld+json">
                  {
                      "@context": "http://schema.org",
                      "@type": "WebSite",
                      "url": "https://www.lowes.com/",
                      "potentialAction": {
                          "@type": "SearchAction",
                          "target": "https://www.lowes.com/search?searchTerm={searchTerm}",
                          "query-input": "required name=searchTerm"
                      }
                  }</script>
        <script type="application/ld+json">
         {
    "@context": "http:\u002F\u002Fschema.org\u002F",
    "@type": "Review",
    "itemReviewed": {
        "@type": "Product",
        "name": "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight"
    },
    "name": "Unmatched Performance: A Review of My New Laptop",
    "author": { "@type": "Person", "name": "richlook" },
   "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": "5" },
    "publisher": { "@type": "Organization", "name": "Best Buy" }
}
        </script>
      `;
    });

    const TestComponent = () => <div>Test Component</div>;
    const getSearchProperties = jest.spyOn(Helpers, "getSearchProperties");
    const getPageNameSpy = jest.spyOn(Helpers, "getPageName");

    it("returns correct page name", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider capture="schema">
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(screen.getByText("Test Component"));
        expect(getPageNameSpy).toHaveBeenCalledWith("/test-path", "schema", {});
        expect(getPageNameSpy).toHaveReturnedWith("Test-path");
    });

    it("returns correct properties", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider capture="schema">
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getSearchProperties).toHaveBeenCalledWith("/test-path", "", "schema", {});
        expect(getSearchProperties).toHaveReturnedWith({
            "organizationName": "Best Buy",
            "pageName": "Test-path",
            "personName": "richlook",
            "productName":
                "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight",
            "ratingBestRating": "5",
            "ratingRatingValue": 5,
            "reviewName": "Unmatched Performance: A Review of My New Laptop",
            "searchactionQueryInput": "required name=searchTerm",
            "searchactionTarget": "https://www.lowes.com/search?searchTerm={searchTerm}",
            "websiteUrl": "https://www.lowes.com/"
        });
    });
    // it("calls functions with meta tag called", () => {
    //     //@ts-ignore
    //     window.location = new URL("http://example.com/test-path");

    //     render(
    //         <MemoryRouter initialEntries={["/test-path"]}>
    //             <FullStoryProvider meta>
    //                 <Routes>
    //                     <Route path="/test-path" element={<TestComponent />} />
    //                 </Routes>
    //             </FullStoryProvider>
    //         </MemoryRouter>
    //     );

    //     expect(getPageNameSpy).toHaveBeenCalledWith("/test-path", true);
    //     expect(getSearchProperties).toHaveBeenCalledWith("", true);
    // });

    // it("is able to extract meta properties from head", () => {
    //     render(
    //         <MemoryRouter initialEntries={["/test-path"]}>
    //             <FullStoryProvider meta>
    //                 <Routes>
    //                     <Route path="/test-path" element={<TestComponent />} />
    //                 </Routes>
    //             </FullStoryProvider>
    //         </MemoryRouter>
    //     );

    //     expect(getPageNameSpy).toHaveReturnedWith("Test Component");
    //     expect(getSearchProperties).toHaveReturnedWith({
    //         description: "Test Description",
    //         keywords: "jest,testing",
    //         "og:title": "Test Title"
    //     });
    // });

    // it("is able to set meta properties in FS", () => {
    //     render(
    //         <MemoryRouter initialEntries={["/test-path"]}>
    //             <FullStoryProvider meta>
    //                 <Routes>
    //                     <Route path="/test-path" element={<TestComponent />} />
    //                 </Routes>
    //             </FullStoryProvider>
    //         </MemoryRouter>
    //     );

    //     expect(FullStory).toHaveBeenCalledWith("setProperties", {
    //         type: "page",
    //         properties: {
    //             pageName: "Test Component",
    //             description: "Test Description",
    //             keywords: "jest,testing",
    //             "og:title": "Test Title"
    //         }
    //     });
    // });

    // it("is able to set meta properties on navigate", () => {
    //     //@ts-ignore
    //     window.location = new URL("http://example.com/test-path");

    //     render(
    //         <FullStoryProvider meta>
    //             <TestComponent />
    //         </FullStoryProvider>
    //     );
    //     expect(getPageNameSpy).toHaveBeenCalledWith("/test-path", true);
    //     expect(getSearchProperties).toHaveBeenCalledWith("", true);

    //     document.head.innerHTML = `
    //     <title>New Component</title>
    //     <meta name="description" content="New Description">
    //     <meta name="keywords" content="jest,testing">
    //     <meta property="og:title" content="New Title">
    //   `;

    //     // Simulate navigation by changing location and dispatching a popstate event
    //     //@ts-ignore
    //     window.location = new URL("http://example.com/new-path");
    //     window.dispatchEvent(new PopStateEvent("popstate"));

    //     expect(getPageNameSpy).toHaveBeenCalledWith("/new-path", true);
    //     expect(getSearchProperties).toHaveBeenCalledWith("", true);
    // });
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

    const setPageSpy = jest.spyOn(FS, "setPage");

    beforeAll(() => {
        // Store the original function in case you need to restore it later
        //@ts-ignore
        global.originalWindowLocation = window.location;
        //@ts-ignore
        delete window.location;
        window.location = {
            //@ts-ignore
            ...global.originalWindowLocation,
            assign: jest.fn()
        };
    });

    afterAll(() => {
        // Restore the original function
        //@ts-ignore
        window.location = global.originalWindowLocation;
    });

    it("can navigate using useFSNavigate", () => {
        render(
            <FullStoryProvider>
                <TestComponent />
            </FullStoryProvider>
        );

        // Assert that setPage was called with the correct arguments
        expect(setPageSpy).toHaveBeenCalledWith({ "pageName": "Custom Page Name", "prop1": "value1" });

        // Assert that window.location.assign was called with the correct URL
        expect(window.location.assign).toHaveBeenCalledWith(expect.stringContaining("/new-path"));
    });

    it("can navigate using useFSNavigate within a BrowserRouter", () => {
        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                        <Route path="/new-path" element={<NewComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Assert that setPage was called with the correct arguments
        expect(setPageSpy).toHaveBeenCalledWith({ "pageName": "Custom Page Name", "prop1": "value1" });
    });
});

describe("Helper Functions", () => {
    it("flattenSchema can return a flattened schema", () => {
        const data: Schema = {
            "@context": "http:\u002F\u002Fschema.org\u002F",
            "@type": "Review",
            "itemReviewed": {
                "@type": "Product",
                "name": "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight"
            },
            "name": "Unmatched Performance: A Review of My New Laptop",
            "author": { "@type": "Person", "name": "richlook" },
            "reviewBody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.\n\nIn terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.\n\nOverall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play.",
            "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": "5" },
            "publisher": { "@type": "Organization", "name": "Best Buy" }
        };

        const props = Helpers.flattenSchema(data);
        expect(props).toEqual({
            "productName":
                "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight",
            "reviewName": "Unmatched Performance: A Review of My New Laptop",
            "personName": "richlook",
            "reviewReviewBody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.\n\nIn terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.\n\nOverall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play.",
            "ratingRatingValue": 5,
            "ratingBestRating": "5",
            "organizationName": "Best Buy"
        });
    });

    it("can remove all special character from key name", () => {
        const data: Schema = {
            "@context": "http://schema.org",
            "@type": "WebSite",
            "url": "https://www.lowes.com/",
            "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.lowes.com/search?searchTerm={searchTerm}",
                "query-input": "required name=searchTerm"
            }
        };

        const props = Helpers.flattenSchema(data);
        expect(props).toEqual({
            "websiteUrl": "https://www.lowes.com/",
            "searchactionTarget": "https://www.lowes.com/search?searchTerm={searchTerm}",
            "searchactionQueryInput": "required name=searchTerm"
        });
    });
});
