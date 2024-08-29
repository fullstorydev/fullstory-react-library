import { createContext } from "react";

// Define the shape of the context data
interface FullStoryContextData {
    useFSNavigate: (to: string, pageName?: string, properties?: any) => void;
}

// Create the context with initial values
export const FullStoryContext = createContext<FullStoryContextData>({} as FullStoryContextData);
