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
    const location = useLocation();

    const useFSNavigate = (to: string, pageName?: string, properties?: any) => {
        try {
            console.log("to", to);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        try {
            const name = getPageName(location.pathname, meta);
            const properties = getSearchProperties(location.search, meta);

            setPage(name, properties);
        } catch (error) {
            console.log("error", error);
        }
    }, [location]);

    return <FullStoryContext.Provider value={{ useFSNavigate }}>{children}</FullStoryContext.Provider>;
};

export default FullStoryProvider;
