import React, { useCallback, useContext, useEffect, useRef } from "react";
import { FullStoryContext } from "./FullStoryContext";
import { setPage } from "../../utils/fullstory";
import { combineObjects, getPageName, getProperties } from "../../utils/helpers";
import { FullStoryProviderProps } from "./types";
import { useLocation, useNavigate } from "react-router-dom";
export const useFSNavigate = () => {
    const context = useContext(FullStoryContext);

    if (context === undefined) {
        throw new Error("useFSNavigate must be used within a FullStoryProvider");
    }

    return context.useFSNavigate;
};

export const FullStoryProvider: React.FC<FullStoryProviderProps> = ({ children, capture = ["all"], rules = {} }) => {
    const navigationTriggeredRef = useRef<boolean>(false);
    const location = useLocation();
    const nav = useNavigate();

    const useFSNavigate = useCallback(
        (to: string, pageName?: string, properties?: any) => {
            // Navigate the user
            nav(to);

            // If a custom pageName is provided, use it, otherwise derive from 'to'
            const name = pageName || getPageName(to, capture, rules);

            // Set the properties if provided, otherwise an empty object
            const { search } = window.location;
            const defaultProperties = getProperties(to, search, capture, rules);

            // check if pagename was defined in the properties
            if (!properties.pageName) {
                // add pageName to properties if not defined
                properties.pageName = name;
            }

            // combine default captured properties and useNav properties
            const props = combineObjects(defaultProperties, properties);

            // Indicate that navigation was triggered via useFSNavigate
            navigationTriggeredRef.current = true;

            setPage(props);
        },
        [capture, rules]
    );

    const handleLocationChange = () => {
        // Check if the navigation was triggered by useFSNavigate
        if (navigationTriggeredRef.current) {
            // Reset the ref for the next navigation event
            navigationTriggeredRef.current = false;
            return;
        }

        try {
            // Pull Search and Pathname from location
            const { pathname, search } = location;

            // find page name
            const name = getPageName(pathname, capture, rules);

            // find properties
            const properties = getProperties(pathname, search, capture, rules);
            // if pageName does not exist on properties add pageName
            if (!properties.pageName) {
                properties.pageName = name;
            }

            // set propterties with FullStory
            setPage(properties);
        } catch (error) {
            console.error("FullStoryProvider handleLocationChange error:", error);
        }
    };

    useEffect(() => {
        handleLocationChange();
    }, [location, handleLocationChange]);

    return <FullStoryContext.Provider value={{ useFSNavigate }}>{children}</FullStoryContext.Provider>;
};

export default FullStoryProvider;
