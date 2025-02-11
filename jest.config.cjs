module.exports = {
    testEnvironment: "jsdom",
    moduleNameMapper: {
        ".(css|less|scss)$": "identity-obj-proxy"
    },
    reporters: ["default", "jest-junit"],
};
