import { FullStory } from "@fullstory/browser";

export function setPage(name: string, properties: any = {}) {
    return FullStory("setProperties", {
        type: "page",
        properties: {
            pageName: name,
            ...properties
        }
    });
}
