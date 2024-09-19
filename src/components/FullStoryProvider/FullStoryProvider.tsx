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
    const pageNameRef = useRef<string>("");
    const propertiesRef = useRef<{ [v: string]: string }>({});

    const location = useLocation();
    const nav = useNavigate();

    function CustomNavigate() {
        // Grab location
        const { search, pathname } = location;

        // If a custom pageName is provided, use it, otherwise derive from 'pathname'
        const name = pageNameRef.current || getPageName(pathname, capture, rules);

        // Pull properties from property ref
        const properties = propertiesRef.current;

        // Find the default properties according to capture rules
        const defaultProperties = getProperties(pathname, search, capture, rules);

        // check if pagename was defined in the properties
        if (!properties.pageName) {
            // add pageName to properties if not defined
            properties["pageName"] = name;
        }

        // combine default captured properties and useNav properties
        const props = combineObjects(defaultProperties, properties);

        // set page properties
        setPage(props);

        // Set the ref back to default
        pageNameRef.current = "";

        // Set the ref back to default
        propertiesRef.current = {};
    }

    const useFSNavigate = useCallback((to: string, pageName?: string, properties?: any) => {
        // Indicate that navigation was triggered via useFSNavigate
        navigationTriggeredRef.current = true;

        // Set pageName
        pageNameRef.current = pageName as string;

        // Set properties
        propertiesRef.current = properties;

        // Navigate the user
        nav(to);
    }, []);

    const handleLocationChange = () => {
        // Check if the navigation was triggered by useFSNavigate
        if (navigationTriggeredRef.current) {
            // Run custom navigate
            CustomNavigate();

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
