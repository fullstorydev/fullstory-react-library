import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";

import packageJson from "./package.json" assert { type: "json" };
import terser from "@rollup/plugin-terser";

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: packageJson.main,
                format: "cjs",
                sourcemap: false
            },
            {
                file: packageJson.module,
                format: "esm",
                sourcemap: false
            }
        ],
        plugins: [
            resolve(),
            commonjs(),
            typescript({ tsconfig: "./tsconfig.json" }),
            postcss(),
            peerDepsExternal(),
            terser()
        ]
    }
];
