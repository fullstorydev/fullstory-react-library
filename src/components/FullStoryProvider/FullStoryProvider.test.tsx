import React from "react";
import { render, screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { MemoryRouter } from "react-router"; // MemoryRouter is useful for testing
import FullStoryProvider from "./FullStoryProvider";
import * as FS from "../../utils/fullstory";
import * as Helpers from "../../utils/helpers";
import { FullStory, init } from "@fullstory/browser";

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

describe("FullStoryProvider", () => {
    // Define a simple test component for the route
    const TestComponent = () => <div>Test Component</div>;
    const getNameSpy = jest.spyOn(Helpers, "getPageName");
    const getPropertiesSpy = jest.spyOn(Helpers, "getSearchProperties");
    const setPropertiesSpy = jest.spyOn(FS, "setPage");

    beforeAll(() => {
        init({ orgId: "123" });
    });

    it("renders with FSProvider", () => {
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
        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getNameSpy).toHaveBeenCalledWith("/test-path");
        expect(getNameSpy).toHaveLastReturnedWith("Test-path");
    });

    it("getPageName returns correct path name for multi path", () => {
        render(
            <MemoryRouter initialEntries={["/test-path/menu"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path/menu" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getNameSpy).toHaveBeenCalledWith("/test-path/menu");
        expect(getNameSpy).toHaveLastReturnedWith("Test-path / Menu");
    });

    it("getPageName returns correct path name with :id attached", () => {
        render(
            <MemoryRouter initialEntries={["/test-path/menu/:id"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path/menu/:id" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getNameSpy).toHaveBeenCalledWith("/test-path/menu/:id");
        expect(getNameSpy).toHaveLastReturnedWith("Test-path / Menu");
    });

    // GET SEARCH PROPS
    it("getSearchProperties returns properties from search", () => {
        render(
            <MemoryRouter initialEntries={["/test-path?property-1=1&property-2=property"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPropertiesSpy).toHaveBeenCalledWith("?property-1=1&property-2=property");
        expect(getPropertiesSpy).toHaveLastReturnedWith({ property_1: 1, property_2: "property" });
    });

    it("getSearchProperties returns object when search is empty", () => {
        render(
            <MemoryRouter initialEntries={["/test-path"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPropertiesSpy).toHaveBeenCalledWith("");
        expect(getPropertiesSpy).toHaveLastReturnedWith({});
    });

    it("getSearchProperties gets property with name", () => {
        render(
            <MemoryRouter initialEntries={["/test-path?name=John%20Doe&property-2=property"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPropertiesSpy).toHaveBeenCalledWith("?name=John%20Doe&property-2=property");
        expect(getPropertiesSpy).toHaveLastReturnedWith({ name: "John Doe", property_2: "property" });
    });

    it("getSearchProperties gets property with multiple - ", () => {
        render(
            <MemoryRouter initialEntries={["/test-path?user-property-1=property"]}>
                <FullStoryProvider>
                    <Routes>
                        <Route path="/test-path" element={<TestComponent />} />
                    </Routes>
                </FullStoryProvider>
            </MemoryRouter>
        );

        expect(getPropertiesSpy).toHaveBeenCalledWith("?user-property-1=property");
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
