import { FullStory } from "@fullstory/browser";

export function setPage(properties: any) {
    return FullStory("setProperties", {
        type: "page",
        properties: {
            ...properties
        }
    });
}
