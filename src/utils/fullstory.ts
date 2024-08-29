import { FullStory } from "@fullstory/browser";

export const fullstory = {
    setPage: async function (name: string, properties: any = {}) {
        return FullStory("setProperties", {
            type: "page",
            properties: {
                pageName: name,
                ...properties
            }
        });
    }
};
