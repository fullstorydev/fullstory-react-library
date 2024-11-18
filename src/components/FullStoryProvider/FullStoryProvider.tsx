import React, { useCallback, useContext, useEffect, useRef } from "react";
import { FullStoryContext } from "./FullStoryContext";
import { setPage } from "../../utils/fullstory";
import { getPageName, getPageProperties } from "../../utils/helpers";
import { FullStoryProviderProps } from "./types";
import { useLocation, useNavigate } from "react-router-dom";

export const useFSNavigate = () => {
    // grab context
    const context = useContext(FullStoryContext);

    // if context is undefined throw error
    if (context === undefined) {
        throw new Error("useFSNavigate must be used within a FullStoryProvider");
    }

    // return hook
    return context.useFSNavigate;
};

export const FullStoryProvider: React.FC<FullStoryProviderProps> = ({ children, capture = ["all"], rules = {} }) => {
    // VARIABLES
    const navigationTriggeredRef = useRef<boolean>(false);
    const pageNameRef = useRef<string>("");
    const propertiesRef = useRef<{ [v: string]: string }>({});

    // NAVIGATION
    const location = useLocation();
    const nav = useNavigate();

    // FUNCTIONS
    function setProperties(): any {
        // Pull Search and Pathname from location
        const { pathname, search } = location;

        // Find PageName
        const name = getPageName(pathname, capture, rules, pageNameRef.current);

        // Find the default properties according to capture rules
        const properties = getPageProperties(pathname, search, capture, rules, propertiesRef.current);

        // if pageName does not exist on properties or name is not empty add pageName
        if (!properties.pageName && name !== "") {
            properties.pageName = name;
        }

        // If there are no props we return
        if (Object.keys(properties).length === 0) {
            return;
        }

        // set propterties with FullStory
        setPage(properties);
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
        try {
            // setProperties
            setProperties();

            // Set the ref back to default
            pageNameRef.current = "";

            // Set the ref back to default
            propertiesRef.current = {};

            // Set ref back to default
            navigationTriggeredRef.current = false;
        } catch (error) {
            console.error("FullStoryProvider handleLocationChange error:", error);
        }
    };

    // USE EFFECTS
    useEffect(() => {
        handleLocationChange();
    }, [location, handleLocationChange]);

    // this effect runs every render and sets timing info on element
    useEffect(() => {
        // get timing object
        // cycle through all the times
        // insert time results onto element via html injection (hard)
    }, []);

    return <FullStoryContext.Provider value={{ useFSNavigate }}>{children}</FullStoryContext.Provider>;
};

export default FullStoryProvider;
