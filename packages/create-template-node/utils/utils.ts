import * as os from "os";
import * as fs from "fs-extra";
import * as spawn from "cross-spawn";
import * as process from "process";
import {bold, cyan, red} from "chalk";
import {
    objectExpression,
    objectProperty,
    stringLiteral,
    identifier,
    numericLiteral,
    booleanLiteral,
    arrayExpression
} from "@babel/types";

export function getNodeVersion() {
    const currentNodeVersion = process.versions.node;
    const semver = currentNodeVersion.split(".");
    return [currentNodeVersion, Number(semver[0])];
}

export function isSafeToCreateProjectIn(root: string) {
    const conflictFiles = fs.readdirSync(root);
    const conflict = conflictFiles.length > 0
    if (conflict) {
        console.log(`${root} has old files: ${conflictFiles.join(', ')}`);
        console.log(
            'Either try using a new directory name, or remove the files listed above.\n'
        );
        return false;
    }
    return true;
}

export function checkThatNpmCanReadCwd() {
    const cwd = process.cwd();
    let childOutput = null;
    try {
        childOutput = spawn.sync('npm', ['config', 'list']).output.join('');
    } catch (e) {
        return true;
    }
    if (typeof childOutput !== 'string') {
        return true;
    }
    const lines = childOutput.split('\n');
    const prefix = '; cwd = ';
    const line = lines.find(line => line.startsWith(prefix));
    if (typeof line !== 'string') {
        return true;
    }
    const npmCWD = line.substring(prefix.length);
    if (npmCWD === cwd) {
        return true;
    }
    console.error(
        red(
            `Could not start an npm process in the right directory.\n\n` +
            `The current directory is: ${bold(cwd)}\n` +
            `However, a newly started npm process runs in: ${bold(
                npmCWD
            )}\n\n` +
            `This is probably caused by a misconfigured system terminal shell.`
        )
    );
    if (process.platform === 'win32') {
        console.error(
            red(`On Windows, this can usually be fixed by running:\n\n`) +
            `  ${cyan(
                'reg'
            )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
            `  ${cyan(
                'reg'
            )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
            red(`Try to run the above two lines in the terminal.\n`) +
            red(
                `To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`
            )
        );
    }
    return false;
}

// TODO 目前未对undefined,null,object键值类型处理
// babel注入对象
export function injectObj(obj:{[k:string]:any}){
    const objExpr:any[] = [];
    const getExpr = (k:any,value:any)=>{
        if(typeof value === 'string'){
            return objectProperty(identifier(k),stringLiteral(value));
        }else if(typeof value==='number'){
            return objectProperty(identifier(k),numericLiteral(value));
        }else if(typeof value==='boolean'){
            return objectProperty(identifier(k),booleanLiteral(value));
        }else if(Array.isArray(value)){
            const arrayValue:any[] = value.map((item)=>{
                const newObj:any[] = [];
                for(const key in item){
                    const v = (item as any)[key];
                    newObj.push(getExpr(key,v));
                }
                return objectExpression(newObj);
            });
            return objectProperty(identifier(k),arrayExpression(arrayValue));
        }
    };
    for(const k in obj){
        const value = (obj as any)[k];
        objExpr.push(getExpr(k,value));
    }
    return objectExpression(objExpr);
}

export function readTxtToJsonLines(lines:string){
    return lines.split(os.EOL)
        .map((str)=>str.trim());
}