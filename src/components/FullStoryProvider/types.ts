import { ReactNode } from "react";

export type CaptureOption = "meta" | "schema" | "all" | "url";
export interface CaptureRules {
    [pathname: string]: CaptureOption;
}
// Prop types for FullStoryProvider
export interface FullStoryProviderProps {
    children: ReactNode;
    capture?: CaptureOption;
    rules?: CaptureRules;
}

export interface SchemaType {
    "@type": string | string[];
    [v: string]: string | number | SchemaType | any[];
}

export interface Schema extends SchemaType {
    "@context": string;
}
