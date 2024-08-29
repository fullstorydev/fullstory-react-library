import React from "react";
import { render, screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { MemoryRouter } from "react-router"; // MemoryRouter is useful for testing
import FullStoryProvider from "./FullStoryProvider";
import { fullstory } from "../../utils/fullstory";
import * as Helpers from "../../utils/helpers";

// jest.mock("../../utils/fullstory", () => ({
//     setPage: jest.fn()
// }));

// jest.mock("../../utils/helpers", () => ({
//     getPageName: jest.fn()
//     // ...jest.requireActual("../../utils/helpers"), // This will preserve other exported functions
//     // getPageName: jest.fn((path: string, meta: boolean = false): string => {
//     //     // you can return a fixed name, or use the 'path' and 'meta' to create a mock name
//     //     if (meta) {
//     //         return "MockMetaData";
//     //     } else {
//     //         // Remove leading and trailing slashes
//     //         const trimmedUrl = path.replace(/^\/|\/$/g, "");
//     //         // Split the path into segments
//     //         const segments = trimmedUrl.split("/");
//     //         // Process segments to capitalize and exclude dynamic parts
//     //         const pageNameParts = segments
//     //             .map(segment => {
//     //                 // Exclude dynamic segments starting with ':'
//     //                 if (segment.startsWith(":")) {
//     //                     return "";
//     //                 }
//     //                 // Exclude the word "page" from segments unless it's inherent in the path
//     //                 if (segment.toLowerCase() === "page") {
//     //                     return "";
//     //                 }
//     //                 // Capitalize the first letter of each segment
//     //                 return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
//     //             })
//     //             .filter(part => part !== ""); // Remove any empty strings resulting from the mapping
//     //         // Join the processed segments with a space
//     //         const pageName = pageNameParts.join(" ");
//     //         return pageName;
//     //     }
//     // })
// }));

describe("FullStoryProvider", () => {
    // Define a simple test component for the route
    const TestComponent = () => <div>Test Component</div>;
    const getNameSpy = jest.spyOn(Helpers, "getPageName");

    it("renders with FSProvider", async () => {
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

    it("getPageName returns correct path name", async () => {
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

    it("getPageName returns correct path name for multi path", async () => {
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

    it("getPageName returns correct path name with :id attached", async () => {
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
});
