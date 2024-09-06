import React, { ReactNode, useCallback, useContext, useEffect, useRef } from "react";
import { FullStoryContext } from "./FullStoryContext";
import { setPage } from "../../utils/fullstory";
import { getPageName, getSearchProperties } from "../../utils/helpers";

// Prop types for FullStoryProvider
interface FullStoryProviderProps {
    children: ReactNode;
    meta?: boolean;
}

export const useFSNavigate = () => {
    const context = useContext(FullStoryContext);

    if (context === undefined) {
        throw new Error("useFSNavigate must be used within a FullStoryProvider");
    }

    return context.useFSNavigate;
};

// Provider component
export const FullStoryProvider: React.FC<FullStoryProviderProps> = ({ children, meta = false }) => {
    const navigationTriggeredRef = useRef<boolean>(false);

    const useFSNavigate = useCallback(
        (to: string, pageName?: string, properties?: any) => {
            // Navigate the user
            console.log("window.location", window.location);
            // to actually navigate, if needed. For now, log the intent to navigate.
            console.log("Navigating to", to);

            // If a custom pageName is provided, use it, otherwise derive from 'to'
            const name = pageName || getPageName(to, meta);

            // Set the properties if provided, otherwise an empty object
            const props = properties || {};

            // Indicate that navigation was triggered via useFSNavigate
            navigationTriggeredRef.current = true;

            setPage(name, props);
        },
        [meta]
    );

    const handleLocationChange = () => {
        // Check if the navigation was triggered by useFSNavigate
        if (navigationTriggeredRef.current) {
            // Reset the ref for the next navigation event
            navigationTriggeredRef.current = false;
            return;
        }

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
