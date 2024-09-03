import React, { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FullStoryContext } from "./FullStoryContext";
import { setPage } from "../../utils/fullstory";
import { getPageName, getSearchProperties } from "../../utils/helpers";

// Prop types for FullStoryProvider
interface FullStoryProviderProps {
    children: ReactNode;
    meta?: boolean;
}

// Provider component
export const FullStoryProvider: React.FC<FullStoryProviderProps> = ({ children, meta = false }) => {
    const useFSNavigate = (to: string, pageName?: string, properties?: any) => {
        try {
            console.log("to", to);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLocationChange = () => {
        try {
            const { pathname, search } = window.location;

            const name = getPageName(pathname, meta);
            const properties = getSearchProperties(search, meta);

            setPage(name, properties);
        } catch (error) {
            console.error("FullStoryProvider handleLocationChange error:", error);
        }
    };

    useEffect(() => {
        // Call handler immediately for initial location
        handleLocationChange();

        // Set up `popstate` event listener to call handler on URL change
        window.addEventListener("popstate", handleLocationChange);

        // Clean up the event listener when the component is unmounted
        return () => {
            window.removeEventListener("popstate", handleLocationChange);
        };
    }, []);

    return <FullStoryContext.Provider value={{ useFSNavigate }}>{children}</FullStoryContext.Provider>;
};

export default FullStoryProvider;
