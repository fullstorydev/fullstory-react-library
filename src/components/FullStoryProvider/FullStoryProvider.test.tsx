import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { MemoryRouter } from "react-router"; // MemoryRouter is useful for testing
import FullStoryProvider, { useFSNavigate } from "./FullStoryProvider";
import * as FS from "../../utils/fullstory";
import * as Helpers from "../../utils/helpers";
import { FullStory, init } from "@fullstory/browser";
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

describe("FullStoryProvider: useFSNavigate", () => {
    const setPageSpy = jest.spyOn(FS, "setPage");
    const getPageProperties = jest.spyOn(Helpers, "getPageProperties");

    beforeEach(() => {
        document.head.innerHTML = `
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

        const DocumentsButton = () => {
            const nav = useFSNavigate();
            return (
                <button
                    data-testid="button"
                    onClick={() => nav("/documents?user_id=123", "Documents", { prop1: "value1" })}
                >
                    Button
                </button>
            );
        };

        const TestComponent = () => {
            return <DocumentsButton />;
        };

        const NewComponent = () => {
            const nav = useNavigate();
            return (
                <button data-testid="button" onClick={() => nav("/")}>
                    Button
                </button>
            );
        };

        // setup
        render(
            <MemoryRouter initialIndex={0} initialEntries={["/"]}>
                <FullStoryProvider pageCaptureRules={{ documents: ["url"] }}>
                    <Routes>
                        <Route path="/" element={<TestComponent />} />
                        <Route path="/documents" element={<NewComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("can navigate using useFSNavigate within a BrowserRouter", () => {
        // Assert that setPage was called with the correct arguments
        expect(getPageProperties).toHaveReturnedWith({
            "organization_name": "Best Buy",
            "person_name": "richlook",
            "pageName": "Home Page",
            "product_name":
                "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight",
            "rating_bestrating": "5",
            "rating_ratingvalue": 5,
            "review_context": "http://schema.org/",
            "review_name": "Unmatched Performance: A Review of My New Laptop"
        });
        expect(setPageSpy).toHaveBeenCalledWith({
            "pageName": "Home Page",
            "review_context": "http:\u002F\u002Fschema.org\u002F",
            "product_name":
                "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight",
            "review_name": "Unmatched Performance: A Review of My New Laptop",
            "person_name": "richlook",
            "rating_ratingvalue": 5,
            "rating_bestrating": "5",
            "organization_name": "Best Buy"
        });
    });

    it("returns correct properties when rule is attached", () => {
        fireEvent.click(screen.getByRole("button"));

        expect(setPageSpy).toHaveBeenLastCalledWith({ user_id: 123, prop1: "value1", pageName: "Documents" });
    });

    it("returns correct properties after ref is changed to true in useFSNavigate", () => {
        fireEvent.click(screen.getByRole("button"));

        expect(setPageSpy).toHaveBeenCalledWith({
            "organization_name": "Best Buy",
            "pageName": "Home Page",
            "person_name": "richlook",
            "product_name":
                "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight",
            "rating_bestrating": "5",
            "rating_ratingvalue": 5,
            "review_context": "http://schema.org/",
            "review_name": "Unmatched Performance: A Review of My New Laptop"
        });
    });
});

describe("FullStoryProvider: Url Configure", () => {
    // Define a simple test component for the route
    const TestComponent = () => <div>Test Component</div>;
    const getNameSpy = jest.spyOn(Helpers, "getPageName");
    const getPagePropertiesSpy = jest.spyOn(Helpers, "getPageProperties");
    const setPageSpy = jest.spyOn(FS, "setPage");

    beforeAll(() => {
        init({ orgId: "123" });
        //@ts-ignore
        delete window.location;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders with FSProvider", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");
        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider defaultCaptureRules={["url"]}>
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
                <FullStoryProvider defaultCaptureRules={["url"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getNameSpy).toHaveBeenCalledWith("/test-path", ["url"], {}, "");
        expect(getNameSpy).toHaveLastReturnedWith("Test Path");
    });

    it("getPageName returns correct path name for multi path", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path/menu");

        render(
            <MemoryRouter initialEntries={["/test-path/menu"]}>
                <FullStoryProvider defaultCaptureRules={["url"]}>
                    <Routes>
                        <Route path="/test-path/menu" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getNameSpy).toHaveBeenCalledWith("/test-path/menu", ["url"], {}, "");
        expect(getNameSpy).toHaveLastReturnedWith("Test Path / Menu");
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
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider defaultCaptureRules={["url"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                        <Route path="/new-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Simulate navigation by changing location and dispatching a popstate event
        //@ts-ignore
        window.location = new URL("http://example.com/new-path");
        window.dispatchEvent(new PopStateEvent("popstate"));

        expect(setPageSpy).toHaveBeenCalled();
    });

    // GET SEARCH PROPS
    it("getPageProperties returns properties from search", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?property-1=1&property-2=property");

        render(
            <MemoryRouter initialEntries={["/test-path?property-1=1&property-2=property"]}>
                <FullStoryProvider defaultCaptureRules={["url"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPagePropertiesSpy).toHaveBeenCalledWith(
            "/test-path",
            "?property-1=1&property-2=property",
            ["url"],
            {},
            {}
        );
        expect(getPagePropertiesSpy).toHaveLastReturnedWith({
            "pageName": "Test Path",
            property_1: 1,
            property_2: "property"
        });
    });

    it("getPageProperties returns object when search is empty", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider defaultCaptureRules={["url"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPagePropertiesSpy).toHaveBeenCalledWith("/test-path", "", ["url"], {}, {});
        expect(getPagePropertiesSpy).toHaveLastReturnedWith({ "pageName": "Test Path" });
    });

    it("getPageProperties gets property with space delimeter", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?name=John%20Doe&property-2=property");

        render(
            <MemoryRouter initialEntries={["/test-path?name=John%20Doe&property-2=property"]}>
                <FullStoryProvider defaultCaptureRules={["url"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPagePropertiesSpy).toHaveBeenCalledWith(
            "/test-path",
            "?name=John%20Doe&property-2=property",
            ["url"],
            {},
            {}
        );
        expect(getPagePropertiesSpy).toHaveLastReturnedWith({
            name: "John Doe",
            "pageName": "Test Path",
            property_2: "property"
        });
    });

    it("getPageProperties gets property with multiple - ", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?user-property-1=property");

        render(
            <MemoryRouter initialEntries={["/test-path?user-property-1=property"]}>
                <FullStoryProvider defaultCaptureRules={["url"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPagePropertiesSpy).toHaveBeenCalledWith("/test-path", "?user-property-1=property", ["url"], {}, {});
        expect(getPagePropertiesSpy).toHaveLastReturnedWith({ "pageName": "Test Path", user_property_1: "property" });
    });

    // SET SEARCH PROPS
    it("setProperties sets with no search items", () => {
        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider defaultCaptureRules={["url"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(setPageSpy).toHaveBeenCalledWith({ pageName: "Test Path" });

        expect(FullStory).toHaveBeenCalledWith("setProperties", {
            type: "page",
            properties: {
                pageName: "Test Path"
            }
        });
    });

    it("setProperties sets with search items", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?property-1=1&property-2=property");

        render(
            <MemoryRouter initialEntries={["/test-path?property-1=1&property-2=property"]}>
                <FullStoryProvider defaultCaptureRules={["url"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(setPageSpy).toHaveBeenCalledWith({ pageName: "Test Path", property_1: 1, property_2: "property" });

        expect(FullStory).toHaveBeenCalledWith("setProperties", {
            type: "page",
            properties: {
                pageName: "Test Path",
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
        }
        </script>
      `;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const TestComponent = () => <div>Test Component</div>;
    const getPageProperties = jest.spyOn(Helpers, "getPageProperties");
    const getPageNameSpy = jest.spyOn(Helpers, "getPageName");

    it("returns correct page name", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider defaultCaptureRules={["schema"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(screen.getByText("Test Component"));
        expect(getPageNameSpy).toHaveBeenCalledWith("/test-path", ["schema"], {}, "");
        expect(getPageNameSpy).toHaveReturnedWith("Test Path");
    });

    it("returns correct properties", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider defaultCaptureRules={["schema"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPageProperties).toHaveBeenCalledWith("/test-path", "", ["schema"], {}, {});
        expect(getPageProperties).toHaveReturnedWith({
            "pageName": "Test Path",
            "organization_name": "Best Buy",
            "person_name": "richlook",
            "product_name":
                "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight",
            "rating_bestrating": "5",
            "rating_ratingvalue": 5,
            "review_context": "http://schema.org/",
            "review_name": "Unmatched Performance: A Review of My New Laptop",
            "review_reviewbody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.  In terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.  Overall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play."
        });
    });

    it("returns correct propertis when schema contains string[]", () => {
        document.head.innerHTML = `
        <script type="application/ld+json">
                {
            "@context": "https://schema.org",
            "@type": "FinancialService",
            "name": "Wells Cargo",
            "knowsAbout": ["Consumer Banking", "Property 2", "Property 3"],
            "currenciesAccepted": "USD",
            "openingHours": "Mo, Tu, We, Th, Fr, 9:00 - 17:00",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "123 Sesame St",
                "addressLocality": "New York City",
                "addressRegion": "NY",
                "postalCode": "10001",
                "addressCountry": "USA"
            }
        }
        </script>
      `;

        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider defaultCaptureRules={["schema"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPageProperties).toHaveBeenCalledWith("/test-path", "", ["schema"], {}, {});
        expect(getPageProperties).toHaveReturnedWith({
            "financialservice_context": "https://schema.org",
            "financialservice_currenciesaccepted": "USD",
            "financialservice_knowsabout": "Consumer Banking, Property 2, Property 3",
            "financialservice_name": "Wells Cargo",
            "financialservice_openinghours": "Mo, Tu, We, Th, Fr, 9:00 - 17:00",
            "pageName": "Test Path",
            "postaladdress_addresscountry": "USA",
            "postaladdress_addresslocality": "New York City",
            "postaladdress_addressregion": "NY",
            "postaladdress_postalcode": "10001",
            "postaladdress_streetaddress": "123 Sesame St"
        });
    });
});

describe("FullStoryProvider: Meta Configure", () => {
    beforeAll(() => {
        init({ orgId: "123" });
        //@ts-ignore
        delete window.location;

        document.head.innerHTML = `
        <title>Bathroom vanity at Lowes.com: Search Results</title>
       <meta name="viewport" content="width=device-width, user-scalable=yes, minimum-scale=1.0,maximum-scale=5.0,initial-scale=1.0">
       <meta property="og:title" content="Bathroom vanity at Lowes.com: Search Results">
       <meta property="og:type" content="website">
       <meta http-equiv="content-type" content="text/html; charset=UTF-8">
      `;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const TestComponent = () => <div>Test Component</div>;
    const getPagePropertiesSpy = jest.spyOn(Helpers, "getPageProperties");
    const getPageNameSpy = jest.spyOn(Helpers, "getPageName");

    it("returns correct page name", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider defaultCaptureRules={["meta"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(getPageNameSpy).toHaveBeenCalledWith("/test-path", ["meta"], {}, "");
        expect(getPageNameSpy).toHaveReturnedWith("Bathroom vanity at Lowes.com: Search Results");
    });

    it("returns correct properties", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider defaultCaptureRules={["meta"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(getPagePropertiesSpy).toHaveBeenCalledWith("/test-path", "", ["meta"], {}, {});
        expect(getPagePropertiesSpy).toHaveReturnedWith({
            "content_type": "text/html; charset=UTF-8",
            "og:title": "Bathroom vanity at Lowes.com: Search Results",
            "og:type": "website",
            "pageName": "Bathroom vanity at Lowes.com: Search Results",
            "viewport": "width=device-width, user-scalable=yes, minimum-scale=1.0,maximum-scale=5.0,initial-scale=1.0"
        });
    });

    it("returns correct properties when config is all", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?person_name=rich&property_2=2");

        render(
            <MemoryRouter initialEntries={["/test-path?person_name=rich&property_2=2"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPagePropertiesSpy).toHaveBeenCalledWith(
            "/test-path",
            "?person_name=rich&property_2=2",
            ["all"],
            {},
            {}
        );
        expect(getPagePropertiesSpy).toHaveReturnedWith({
            pageName: "Test Path",
            person_name: "rich",
            property_2: 2,
            viewport: "width=device-width, user-scalable=yes, minimum-scale=1.0,maximum-scale=5.0,initial-scale=1.0",
            "og:title": "Bathroom vanity at Lowes.com: Search Results",
            "og:type": "website",
            "content_type": "text/html; charset=UTF-8"
        });
    });
});

describe("FullStoryProvider: Auto Configure", () => {
    beforeAll(() => {
        init({ orgId: "123" });
        //@ts-ignore
        delete window.location;

        document.head.innerHTML = `
          <title>Bathroom vanity at Lowes.com: Search Results</title>
       <meta name="viewport" content="width=device-width, user-scalable=yes, minimum-scale=1.0,maximum-scale=5.0,initial-scale=1.0">
       <meta property="og:title" content="Bathroom vanity at Lowes.com: Search Results">
       <meta property="og:type" content="website">
       <meta http-equiv="content-type" content="text/html; charset=UTF-8">
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
            "reviewBody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.\n\nIn terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.\n\nOverall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play.",
            "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": "5" },
            "publisher": { "@type": "Organization", "name": "Best Buy" }
        }
        </script>
      `;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const TestComponent = () => <div>Test Component</div>;
    const getPageProperties = jest.spyOn(Helpers, "getPageProperties");
    const getPageNameSpy = jest.spyOn(Helpers, "getPageName");

    it("returns correct page name", () => {
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
        expect(getPageNameSpy).toHaveBeenCalledWith("/test-path", ["all"], {}, "");
        expect(getPageNameSpy).toHaveReturnedWith("Test Path");
    });

    it("returns correct pagname when path has an id", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path/product/1234");

        render(
            <MemoryRouter initialEntries={["/test-path/product/1234"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path/product/:id" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(screen.getByText("Test Component"));
        expect(getPageNameSpy).toHaveBeenCalledWith("/test-path/product/1234", ["all"], {}, "");
        expect(getPageNameSpy).toHaveReturnedWith("Test Path / Product / 1234");
    });

    it("returns correct page name when path is /", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/");

        render(
            <MemoryRouter initialEntries={["/"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(screen.getByText("Test Component"));
        expect(getPageNameSpy).toHaveBeenCalledWith("/", ["all"], {}, "");
        expect(getPageNameSpy).toHaveReturnedWith("Home Page");
    });

    it("returns correct properties", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?property_1=one&property_2=2");

        render(
            <MemoryRouter initialEntries={["/test-path?property_1=one&property_2=2"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPageProperties).toHaveBeenCalledWith("/test-path", "?property_1=one&property_2=2", ["all"], {}, {});
        expect(getPageProperties).toHaveReturnedWith({
            "content_type": "text/html; charset=UTF-8",
            "og:title": "Bathroom vanity at Lowes.com: Search Results",
            "og:type": "website",
            "organization_name": "Best Buy",
            "pageName": "Test Path",
            "person_name": "richlook",
            "product_name":
                "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight",
            "property_1": "one",
            "property_2": 2,
            "rating_bestrating": "5",
            "rating_ratingvalue": 5,
            "review_context": "http://schema.org/",
            "review_name": "Unmatched Performance: A Review of My New Laptop",
            "review_reviewbody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.  In terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.  Overall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play.",
            "viewport": "width=device-width, user-scalable=yes, minimum-scale=1.0,maximum-scale=5.0,initial-scale=1.0"
        });
    });

    it("returns correct properties when some values match", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?person_name=rich&property_2=2");

        render(
            <MemoryRouter initialEntries={["/test-path?person_name=rich&property_2=2"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPageProperties).toHaveBeenCalledWith("/test-path", "?person_name=rich&property_2=2", ["all"], {}, {});
        expect(getPageProperties).toHaveReturnedWith({
            "content_type": "text/html; charset=UTF-8",
            "og:title": "Bathroom vanity at Lowes.com: Search Results",
            "og:type": "website",
            "organization_name": "Best Buy",
            "pageName": "Test Path",
            "person_name": "richlook",
            "product_name":
                "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight",
            "property_2": 2,
            "rating_bestrating": "5",
            "rating_ratingvalue": 5,
            "review_context": "http://schema.org/",
            "review_name": "Unmatched Performance: A Review of My New Laptop",
            "review_reviewbody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.  In terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.  Overall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play.",
            "viewport": "width=device-width, user-scalable=yes, minimum-scale=1.0,maximum-scale=5.0,initial-scale=1.0"
        });
    });

    it("returns correct properties from Wells Cargo", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?property_1=one&property_2=2");
        document.head.innerHTML = `
      <script type="application/ld+json">
             {"@context":"https://schema.org/","@graph":[{"@type":"BankAccount","name":"Select Platinum account","offers":{"@type":"Offer","eligibleCustomerType":"http://purl.org/goodrelations/v1#Enduser","priceSpecification":{"@type":"PriceSpecification","priceCurrency":"GBP","price":"16","eligibleQuantity":{"@type":"QuantitativeValue","value":"1","unitCode":"ANN"}},"description":"You need to be aged 18 or over, and UK resident to apply.","offeredBy":{"@type":"BankOrCreditUnion","@id":"http://rbs.co.uk","name":"RBS"}},"feesAndCommissionsSpecification":"http://personal.rbs.co.uk/content/dam/rbs_co_uk/currentaccounts/downloads/Reward/Personal%20and%20Private%20Current%20Account%20Fees%20and%20Interest%20Rates.pdf"}]}

      </script>
    `;

        render(
            <MemoryRouter initialEntries={["/test-path?property_1=one&property_2=2"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPageProperties).toHaveBeenCalledWith("/test-path", "?property_1=one&property_2=2", ["all"], {}, {});
        expect(getPageProperties).toHaveReturnedWith({
            "bankaccount_feesandcommissionsspecification":
                "http://personal.rbs.co.uk/content/dam/rbs_co_uk/currentaccounts/downloads/Reward/Personal%20and%20Private%20Current%20Account%20Fees%20and%20Interest%20Rates.pdf",
            "bankaccount_name": "Select Platinum account",
            "bankorcreditunion_name": "RBS",
            "context": "https://schema.org/",
            "offer_description": "You need to be aged 18 or over, and UK resident to apply.",
            "offer_eligiblecustomertype": "http://purl.org/goodrelations/v1#Enduser",
            "pageName": "Test Path",
            "pricespecification_price": "16",
            "pricespecification_pricecurrency": "GBP",
            "property_1": "one",
            "property_2": 2,
            "quantitativevalue_unitcode": "ANN",
            "quantitativevalue_value": "1"
        });
    });
});

describe("FullStoryProvider: None Configure", () => {
    beforeAll(() => {
        init({ orgId: "123" });
        //@ts-ignore
        delete window.location;

        document.head.innerHTML = `
          <title>Bathroom vanity at Lowes.com: Search Results</title>
       <meta name="viewport" content="width=device-width, user-scalable=yes, minimum-scale=1.0,maximum-scale=5.0,initial-scale=1.0">
       <meta property="og:title" content="Bathroom vanity at Lowes.com: Search Results">
       <meta property="og:type" content="website">
       <meta http-equiv="content-type" content="text/html; charset=UTF-8">
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
            "reviewBody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.\n\nIn terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.\n\nOverall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play.",
            "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": "5" },
            "publisher": { "@type": "Organization", "name": "Best Buy" }
        }
        </script>
      `;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const TestComponent = () => <div>Test Component</div>;
    const getPageProperties = jest.spyOn(Helpers, "getPageProperties");
    const getPageNameSpy = jest.spyOn(Helpers, "getPageName");
    const setPageSpy = jest.spyOn(FS, "setPage");

    it("returns no page name", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider defaultCaptureRules={["none"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(getPageNameSpy).toHaveBeenCalledWith("/test-path", ["none"], {}, "");
        expect(getPageNameSpy).toHaveReturnedWith("");
    });

    it("returns no properties", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path/product/1234");

        render(
            <MemoryRouter initialEntries={["/test-path/product/1234"]}>
                <FullStoryProvider defaultCaptureRules={["none"]}>
                    <Routes>
                        <Route path="/test-path/product/:id" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(screen.getByText("Test Component"));
        expect(getPageProperties).toHaveBeenCalledWith("/test-path/product/1234", "", ["none"], {}, {});
        expect(getPageProperties).toHaveReturnedWith({});
        expect(setPageSpy).toHaveBeenCalledTimes(0);
    });

    it("returns no pageName on specific page", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/documents");

        render(
            <MemoryRouter initialEntries={["/documents"]}>
                <FullStoryProvider pageCaptureRules={{ "documents": ["none"] }}>
                    <Routes>
                        <Route path="/documents" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(getPageNameSpy).toHaveBeenCalledWith("/documents", ["all"], { "documents": ["none"] }, "");
        expect(getPageNameSpy).toHaveReturnedWith("");
    });

    it("returns no properties on specific page", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/documents");

        render(
            <MemoryRouter initialEntries={["/documents"]}>
                <FullStoryProvider pageCaptureRules={{ "documents": ["none"] }}>
                    <Routes>
                        <Route path="/documents" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(getPageProperties).toHaveBeenCalledWith("/documents", "", ["all"], { "documents": ["none"] }, {});
        expect(getPageProperties).toHaveReturnedWith({});
    });

    it("returns no properties on FSUseNavigate", () => {
        const TestComponent = () => {
            const nav = useFSNavigate();
            return (
                <button
                    data-testid="button"
                    onClick={() => nav("/documents?user_id=123", "Documents", { prop1: "value1" })}
                >
                    Button
                </button>
            );
        };

        const NewComponent = () => {
            const nav = useNavigate();
            return (
                <button data-testid="button" onClick={() => nav("/")}>
                    Button
                </button>
            );
        };

        // setup
        render(
            <MemoryRouter initialIndex={0} initialEntries={["/"]}>
                <FullStoryProvider pageCaptureRules={{ documents: ["none"] }}>
                    <Routes>
                        <Route path="/" element={<TestComponent />} />
                        <Route path="/documents" element={<NewComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole("button"));

        expect(getPageProperties).toHaveLastReturnedWith({});
        expect(setPageSpy).toHaveBeenCalledTimes(1);
    });
});

describe("FullStoryProvider: Multi Default Rule Configure", () => {
    beforeAll(() => {
        init({ orgId: "123" });
        //@ts-ignore
        delete window.location;

        document.head.innerHTML = `
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
            "reviewBody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.\n\nIn terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.\n\nOverall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play.",
            "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": "5" },
            "publisher": { "@type": "Organization", "name": "Best Buy" }
        }
        </script>
      `;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const TestComponent = () => <div>Test Component</div>;
    const getPageProperties = jest.spyOn(Helpers, "getPageProperties");
    const getPageNameSpy = jest.spyOn(Helpers, "getPageName");

    it("returns correct page name", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider defaultCaptureRules={["schema", "url"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(screen.getByText("Test Component"));
        expect(getPageNameSpy).toHaveBeenCalledWith("/test-path", ["schema", "url"], {}, "");
        expect(getPageNameSpy).toHaveReturnedWith("Test Path");
    });

    it("returns correct properties", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?property_1=one&property_2=2");

        render(
            <MemoryRouter initialEntries={["/test-path?property_1=one&property_2=2"]}>
                <FullStoryProvider defaultCaptureRules={["schema", "url"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPageProperties).toHaveBeenCalledWith(
            "/test-path",
            "?property_1=one&property_2=2",
            ["schema", "url"],
            {},
            {}
        );
        expect(getPageProperties).toHaveReturnedWith({
            "organization_name": "Best Buy",
            "pageName": "Test Path",
            "person_name": "richlook",
            "product_name":
                "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight",
            "property_1": "one",
            "property_2": 2,
            "rating_bestrating": "5",
            "rating_ratingvalue": 5,
            "review_context": "http://schema.org/",
            "review_name": "Unmatched Performance: A Review of My New Laptop",
            "review_reviewbody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.  In terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.  Overall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play."
        });
    });

    it("returns correct properties when some values match", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?person_name=rich&property_2=2");

        render(
            <MemoryRouter initialEntries={["/test-path?person_name=rich&property_2=2"]}>
                <FullStoryProvider defaultCaptureRules={["schema", "url"]}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPageProperties).toHaveBeenCalledWith(
            "/test-path",
            "?person_name=rich&property_2=2",
            ["schema", "url"],
            {},
            {}
        );
        expect(getPageProperties).toHaveReturnedWith({
            "organization_name": "Best Buy",
            "pageName": "Test Path",
            "person_name": "richlook",
            "product_name":
                "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight",
            "property_2": 2,
            "rating_bestrating": "5",
            "rating_ratingvalue": 5,
            "review_context": "http://schema.org/",
            "review_name": "Unmatched Performance: A Review of My New Laptop",
            "review_reviewbody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.  In terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.  Overall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play."
        });
    });
});

describe("FullStoryProvider: Path Rule Configure", () => {
    beforeAll(() => {
        init({ orgId: "123" });
        //@ts-ignore
        delete window.location;

        document.head.innerHTML = `
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
            "reviewBody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.\n\nIn terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.\n\nOverall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play.",
            "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": "5" },
            "publisher": { "@type": "Organization", "name": "Best Buy" }
        }
        </script>
      `;
    });

    const TestComponent = () => <div>Test Component</div>;
    const getPageProperties = jest.spyOn(Helpers, "getPageProperties");
    const getPageNameSpy = jest.spyOn(Helpers, "getPageName");

    it("returns correct page name", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path");

        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider defaultCaptureRules={["schema", "url"]} pageCaptureRules={{ "test-path": ["url"] }}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        // Check if the route is rendered correctly with TestComponent
        expect(screen.getByText("Test Component"));
        expect(getPageNameSpy).toHaveBeenCalledWith("/test-path", ["schema", "url"], { "test-path": ["url"] }, "");
        expect(getPageNameSpy).toHaveReturnedWith("Test Path");
    });

    it("returns correct properties when default is defined", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?property_1=one&property_2=2");

        render(
            <MemoryRouter initialEntries={["/test-path?property_1=one&property_2=2"]}>
                <FullStoryProvider defaultCaptureRules={["schema", "meta"]} pageCaptureRules={{ "test-path": ["url"] }}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPageProperties).toHaveBeenCalledWith(
            "/test-path",
            "?property_1=one&property_2=2",
            ["schema", "meta"],
            {
                "test-path": ["url"]
            },
            {}
        );
        expect(getPageProperties).toHaveReturnedWith({ "pageName": "Test Path", "property_1": "one", "property_2": 2 });
    });

    it("returns correct properties when default is all", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/documents?user_id=90867");

        render(
            <MemoryRouter initialEntries={["/documents?user_id=90867"]}>
                <FullStoryProvider pageCaptureRules={{ "documents": ["url"] }}>
                    <Routes>
                        <Route path="/documents" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPageProperties).toHaveBeenCalledWith(
            "/documents",
            "?user_id=90867",
            ["all"],
            {
                "documents": ["url"]
            },
            {}
        );
        expect(getPageProperties).toHaveReturnedWith({ "pageName": "Documents", "user_id": 90867 });
    });

    it("returns correct properties when some values match", () => {
        //@ts-ignore
        window.location = new URL("http://example.com/test-path?person_name=rich&property_2=2");

        render(
            <MemoryRouter initialEntries={["/test-path?person_name=rich&property_2=2"]}>
                <FullStoryProvider pageCaptureRules={{ "test-path": ["schema", "url"] }}>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPageProperties).toHaveBeenCalledWith(
            "/test-path",
            "?person_name=rich&property_2=2",
            ["all"],
            {
                "test-path": ["schema", "url"]
            },
            {}
        );
        expect(getPageProperties).toHaveReturnedWith({
            "organization_name": "Best Buy",
            "pageName": "Test Path",
            "person_name": "richlook",
            "product_name":
                "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight",
            "property_2": 2,
            "rating_bestrating": "5",
            "rating_ratingvalue": 5,
            "review_context": "http://schema.org/",
            "review_name": "Unmatched Performance: A Review of My New Laptop",
            "review_reviewbody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.  In terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.  Overall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play."
        });
    });
});

describe("Helper Functions", () => {
    it("flattenSchema can return a flattened schema object", () => {
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
            "review_context": "http:\u002F\u002Fschema.org\u002F",
            "product_name":
                "Apple - MacBook Air 13-inch Laptop - M3 chip Built for Apple Intelligence - 8GB Memory -  256GB SSD - Midnight",
            "review_name": "Unmatched Performance: A Review of My New Laptop",
            "person_name": "richlook",
            "review_reviewbody":
                "I recently purchased a new laptop for my household, and I have been extremely impressed with its performance. The laptop is perfect for both work and entertainment purposes, and it has become an essential part of our daily routine. The sleek design and powerful specifications make it a great addition to our home office setup.\n\nIn terms of performance, this laptop really stands out. It boots up quickly, and I haven't experienced any lag or slowdown, even when running multiple applications simultaneously. The battery life is also impressive, allowing me to work for extended periods without having to constantly search for a power outlet.\n\nOverall, I couldn't be happier with my new laptop. It has exceeded my expectations in every way and has become an indispensable tool for both work and play.",
            "rating_ratingvalue": 5,
            "rating_bestrating": "5",
            "organization_name": "Best Buy"
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
            "website_context": "http://schema.org",
            "website_url": "https://www.lowes.com/",
            "searchaction_target": "https://www.lowes.com/search?searchTerm={searchTerm}",
            "searchaction_queryinput": "required name=searchTerm"
        });
    });

    it("flattenSchema can return a flattend schema array", () => {
        const data: Schema = {
            "@context": "https://schema.org",
            "@type": "RadioSeries",
            "episode": {
                "@type": "RadioEpisode",
                "position": "604",
                "publication": [
                    {
                        "@type": "BroadcastEvent",
                        "publishedOn": {
                            "@type": "BroadcastService",
                            "url": "http://www.bbc.co.uk/radio4"
                        },
                        "startDate": "2013-11-07T09:00:00+01:00"
                    },
                    {
                        "@type": "OnDemandEvent",
                        "startDate": "2013-11-07T09:45:00+01:00"
                    }
                ],
                "url": "http://www.bbc.co.uk/programmes/b03ggc19"
            },
            "url": "http://www.bbc.co.uk/programmes/b006qykl"
        };

        const props = Helpers.flattenSchema(data);
        expect(props).toEqual({
            "radioseries_context": "https://schema.org",
            "radioepisode_position": "604",
            "broadcastservice_url": "http://www.bbc.co.uk/radio4",
            "broadcastevent_startdate": "2013-11-07T09:00:00+01:00",
            "ondemandevent_startdate": "2013-11-07T09:45:00+01:00",
            "radioepisode_url": "http://www.bbc.co.uk/programmes/b03ggc19",
            "radioseries_url": "http://www.bbc.co.uk/programmes/b006qykl"
        });
    });

    it("flatten schema can handle when type isn't explicit", () => {
        const data: Schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "item": {
                        "@id": "https://example.com/dresses",
                        "name": "Dresses"
                    }
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "item": {
                        "@id": "https://example.com/dresses/real",
                        "name": "Real Dresses"
                    }
                }
            ]
        };

        const props = Helpers.flattenSchema(data);
        expect(props).toEqual({
            "breadcrumblist_context": "https://schema.org",
            "listitem_name": "Dresses / Real Dresses",
            "listitem_position": "1 / 2"
        });
    });

    it("flatten schema with array for the type", () => {
        const data: Schema = {
            "@context": "https://schema.org",
            "@type": ["ItemList", "CreativeWork"],
            "name": "Top 5 covers of Bob Dylan Songs",
            "author": "John Doe",
            "about": {
                "@type": "MusicRecording",
                "byArtist": {
                    "@type": "MusicGroup",
                    "name": "Bob Dylan"
                }
            },
            "itemListOrder": "https://schema.org/ItemListOrderAscending",
            "numberOfItems": 5,
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 5,
                    "item": {
                        "@type": "MusicRecording",
                        "name": "If Not For You",
                        "byArtist": {
                            "@type": "MusicGroup",
                            "name": "George Harrison"
                        }
                    }
                },
                {
                    "@type": "ListItem",
                    "position": 4,
                    "item": {
                        "@type": "MusicRecording",
                        "name": "The Times They Are A-Changin'",
                        "byArtist": {
                            "@type": "MusicGroup",
                            "name": "Tracy Chapman"
                        }
                    }
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "item": {
                        "@type": "MusicRecording",
                        "name": "It Ain't Me Babe",
                        "byArtist": [
                            {
                                "@type": "MusicGroup",
                                "name": "Johnny Cash"
                            },
                            {
                                "@type": "MusicGroup",
                                "name": "June Carter Cash"
                            }
                        ]
                    }
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "item": {
                        "@type": "MusicRecording",
                        "name": "Don't Think Twice It's Alright",
                        "byArtist": {
                            "@type": "MusicGroup",
                            "name": "Waylon Jennings"
                        }
                    }
                },
                {
                    "@type": "ListItem",
                    "position": 1,
                    "item": {
                        "@type": "MusicRecording",
                        "name": "All Along the Watchtower",
                        "byArtist": {
                            "@type": "MusicGroup",
                            "name": "Jimi Hendrix"
                        }
                    }
                }
            ]
        };

        const props = Helpers.flattenSchema(data);
        expect(props).toEqual({
            "itemlist_creativework_context": "https://schema.org",
            "itemlist_creativework_name": "Top 5 covers of Bob Dylan Songs",
            "itemlist_creativework_author": "John Doe",
            "itemlist_creativework_itemlistorder": "https://schema.org/ItemListOrderAscending",
            "itemlist_creativework_numberofitems": 5,
            "musicgroup_name":
                "Bob Dylan / George Harrison / Tracy Chapman / Johnny Cash / June Carter Cash / Waylon Jennings / Jimi Hendrix",
            "musicrecording_name":
                "If Not For You / The Times They Are A-Changin' / It Ain't Me Babe / Don't Think Twice It's Alright / All Along the Watchtower",
            "listitem_position": "5 / 4 / 3 / 2 / 1"
        });
    });
});
