function isNumber(value: any): boolean {
    return !isNaN(value);
}

export function getPageName(path: string, meta: boolean = false): string {
    if (meta) {
        return getMetaData();
    } else {
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

export function getProperties(search: string, meta: boolean = false): any {
    if (meta) {
        return getMetaData();
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
            let val: string | number = decodeURIComponent(value);
            switch (true) {
                case isNumber(val):
                    val = parseInt(val);
                default:
                    val = val;
            }

            // Assign the key-value pair to the accumulator object, decoding the value
            accumulator[key] = val;

            return accumulator;
        }, {});

        return params;
    } else {
        return {};
    }
}

export function getMetaData(): string {
    return "Meta Data";
}
