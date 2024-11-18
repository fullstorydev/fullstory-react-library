import * as Helpers from "../../utils/helpers";
import { FullStoryImage } from "../../utils/types";

describe.only("Helper Functions", () => {
    it("schema: can return a fs schema JSON", () => {
        const data = {
            carName: "Mazda",
            price: 100,
            carId: "1234",
            city: "Houston"
        };

        const returnData = JSON.stringify({
            "id": "str",
            "data-carName": {
                name: "carName",
                type: "str"
            },
            "data-price": {
                name: "price",
                type: "real"
            },
            "data-carId": {
                name: "carId",
                type: "str"
            },
            "data-city": {
                name: "city",
                type: "str"
            }
        });

        const { schema } = Helpers.createElementData(data);
        expect(JSON.stringify(schema)).toEqual(returnData);
    });

    it("schema: can return a fs schema JSON with Array", () => {
        const data = {
            carName: "Mazda",
            price: 100,
            carId: "1234",
            city: ["Houston", "Austin", "Dallas"]
        };

        const returnData = JSON.stringify({
            "id": "str",
            "data-carName": {
                name: "carName",
                type: "str"
            },
            "data-price": {
                name: "price",
                type: "real"
            },
            "data-carId": {
                name: "carId",
                type: "str"
            },
            "data-city": {
                name: "city",
                type: "strs"
            }
        });

        const { schema } = Helpers.createElementData(data);
        expect(JSON.stringify(schema)).toEqual(returnData);
    });

    it("schema: can return a fs schema JSON with Array of dates", () => {
        const date = new Date();
        const data = {
            carName: "Mazda",
            price: 100,
            carId: "1234",
            dates: [date]
        };

        const returnData = JSON.stringify({
            "id": "str",
            "data-carName": {
                name: "carName",
                type: "str"
            },
            "data-price": {
                name: "price",
                type: "real"
            },
            "data-carId": {
                name: "carId",
                type: "str"
            },
            "data-dates": {
                name: "dates",
                type: "dates"
            }
        });

        const { schema } = Helpers.createElementData(data);
        expect(JSON.stringify(schema)).toEqual(returnData);
    });

    it("schema: can return a fs schema JSON with date", () => {
        const data = {
            carName: "Mazda",
            price: 100,
            carId: "1234",
            date: new Date()
        };

        const returnData = JSON.stringify({
            "id": "str",
            "data-carName": {
                name: "carName",
                type: "str"
            },
            "data-price": {
                name: "price",
                type: "real"
            },
            "data-carId": {
                name: "carId",
                type: "str"
            },
            "data-date": {
                name: "date",
                type: "date"
            }
        });

        const { schema } = Helpers.createElementData(data);
        expect(JSON.stringify(schema)).toEqual(returnData);
    });

    it("schema: throws error with wrong data type (object)", () => {
        const data = {
            carName: "Mazda",
            price: 100,
            carId: "1234",
            city: "Houston",
            dates: { start: new Date(), end: new Date() }
        };

        expect(() => Helpers.createElementData(data)).toThrow("Data type of object is not allowed");
    });

    it("schema: throws error with wrong data type (function)", () => {
        const data = {
            carName: "Mazda",
            price: 100,
            carId: "1234",
            city: "Houston",
            dates: () => console.log("wrong data")
        };

        expect(() => Helpers.createElementData(data)).toThrow("Data type of function is not allowed");
    });

    it("schema: throws error with wrong data type (undefined)", () => {
        const data = {
            carName: "Mazda",
            price: 100,
            carId: "1234",
            city: "Houston",
            dates: undefined
        };

        expect(() => Helpers.createElementData(data)).toThrow("Data type of undefined is not allowed");
    });

    it("schema: throws error with wrong data type in Array (object)", () => {
        const data = {
            carName: "Mazda",
            price: 100,
            carId: "1234",
            city: "Houston",
            dates: [{}]
        };

        expect(() => Helpers.createElementData(data)).toThrow("Data type of object is not allowed");
    });

    it("elementData: can create correct data elements", () => {
        const data = {
            carName: "Mazda",
            price: 100,
            carId: "1234",
            city: "Houston"
        };

        const dateElements = {
            "data-carName": "Mazda",
            "data-price": "100",
            "data-carId": "1234",
            "data-city": "Houston"
        };

        const { elementData } = Helpers.createElementData(data);
        expect(elementData).toEqual(dateElements);
    });

    it("elementData: can return a fs schema JSON with Array", () => {
        const data = {
            carName: "Mazda",
            price: 100,
            carId: "1234",
            city: ["Houston", "Austin", "Dallas"]
        };

        const dateElements = {
            "data-carName": "Mazda",
            "data-price": "100",
            "data-carId": "1234",
            "data-city": ["Houston", "Austin", "Dallas"]
        };

        const { elementData } = Helpers.createElementData(data);
        expect(elementData).toEqual(dateElements);
    });

    it("seperateProps: can seperate extra props from html props", () => {
        const props: FullStoryImage = {
            id: "1234",
            name: "test-element",
            key: "0",
            className: "classname",
            style: {},
            elementData: { carName: "Mazda", price: 100, carId: "1234", city: ["Houston", "Austin", "Dallas"] }
        };

        const returnData = {
            id: "1234",
            key: "0",
            className: "classname",
            style: {}
        };
        const elementData = Helpers.seperateProps(props);
        expect(elementData).toEqual(returnData);
    });
});
