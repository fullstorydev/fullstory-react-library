import { ReactNode } from "react";

export type CaptureOption = "meta" | "schema" | "all" | "url" | "none";
export type CaptureOptions = CaptureOption[];

export interface CaptureRules {
    [pathname: string]: CaptureOptions;
}
// Prop types for FullStoryProvider
export interface FullStoryProviderProps {
    children: ReactNode;
    defaultCaptureRules?: CaptureOptions;
    pageCaptureRules?: CaptureRules;
}

export interface SchemaType {
    "@type": string | string[];
    [v: string]: string | number | SchemaType | any[];
}

export interface Schema extends SchemaType {
    "@context": string;
}
