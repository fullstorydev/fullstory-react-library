function isNumber(value: any): boolean {
    return !isNaN(value);
}

function getMetaProperties(metaTags: HTMLCollectionOf<HTMLMetaElement>): any {
    const props: any = {};

    for (let i = 0; i < metaTags.length; i++) {
        const keys = metaTags[i].getAttributeNames();

        if (keys.includes("name") || keys.includes("property")) {
            const key: string = metaTags[i].getAttribute(keys[0]) as string;
            const content = metaTags[i].getAttribute(keys[1]);

            props[key] = content;
        }
    }

    return props;
}

export function getPageName(path: string, meta: boolean = false): string {
    if (meta) {
        return document.title;
    } else {
        if (path === "/") {
            return "Home Page";
        }
        // Remove leading and trailing slashes
        const trimmedUrl = path.replace(/^\/|\/$/g, "");

        // Split the path into segments
        const segments = trimmedUrl.split("/");

        // Process segments to capitalize and exclude dynamic parts
        const pageNameParts = segments
            .map(segment => {
                // Exclude dynamic segments starting with ':'
                if (segment.startsWith(":")) {
                    return "";
                }
                // Exclude the word "page" from segments unless it's inherent in the path
                if (segment.toLowerCase() === "page") {
                    return "";
                }
                // Capitalize the first letter of each segment
                return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
            })
            .filter(part => part !== ""); // Remove any empty strings resulting from the mapping

        // Join the processed segments with a space
        const pageName = pageNameParts.join(" / ");

        return pageName;
    }
}

export function getSearchProperties(search: string, meta: boolean = false): any {
    if (meta) {
        const metaTags = document.getElementsByTagName("meta");
        const props = getMetaProperties(metaTags);

        return props;
    } else if (!!search) {
        // Remove the leading '?' from the query string
        const query = search[0] === "?" ? search.substring(1) : search;

        // Split the query string into parts using '&' as the separator
        const parts = query.split("&");

        // Reduce the array of strings into an object with key-value pairs
        const params = parts.reduce((accumulator: any, current: any) => {
            // Split each part into key and value
            const [key, value] = current.split("=");

            // Find values data type
            let v: string | number = decodeURIComponent(value);
            switch (true) {
                case isNumber(v):
                    v = parseInt(v);
                default:
                    v = v;
            }

            // Change - to _ in key
            let k = key.replaceAll("-", "_");

            // Assign the key-value pair to the accumulator object, decoding the value
            accumulator[k] = v;

            return accumulator;
        }, {});

        return params;
    } else {
        return {};
    }
}
