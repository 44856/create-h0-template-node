#!/usr/bin/env node

import * as process from "process";
import { init } from "./create-template";
import { getNodeVersion } from "./utils";

const [currentNodeVersion,major] = getNodeVersion();

if (Number(major) < 14) {
    console.error(
        '   You are running Node ' +
        currentNodeVersion +
        '   .\n' +
        '   Create h0 template requires Node 14 or higher. \n' +
        '   Please update your version of Node.'
    );
    process.exit(1);
}

init();