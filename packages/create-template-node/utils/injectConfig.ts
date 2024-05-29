import * as path from "path";
import * as fs from "fs-extra";
import { green, yellow, red } from "chalk";
import process from "process";
import * as os from "os";
import {AnyObj} from "../types";
import {VALID_CONFIG_ITEM} from "./constants";

export function readFileToObj(path:string){
    const obj:AnyObj = Object.create({});
    try {
        const lines = fs.readFileSync(path, 'utf-8');
        const real_lines = lines.split(os.EOL)
            .map((str)=>str.trim())
        console.log(real_lines)
        real_lines.forEach((line)=>{
            const item_map = line.split('=');
            if(item_map.length===2){
                obj[item_map[0].trim()] = item_map[1].trim();
            }
        });
    }catch (e) {
        console.error(e);
    }
    return obj;
}

function readConfig(config_path:string,item?:string){
    if(!fs.existsSync(config_path)){
        console.error(`Not Have ${yellow('Config')} Yet!In ${red(config_path)}\n`);
        console.log(`Please Init Config By ${green('Setting')} Or ${green('Run One Time')}`)
        process.exit(1);
    }
    const lines = fs.readFileSync(config_path, 'utf-8');
    return lines;
}

async function injectConfig(config_path:string,item:string,content:string){
    let origin_config:AnyObj = Object.create({});
    if(!fs.existsSync(config_path)){
        try {
            fs.createFileSync(config_path);
        }catch (e){
            console.error(e);
            return false;
        }
    }else{
        origin_config = readFileToObj(config_path);
    }
    origin_config[item] = content;
    const file_lines:Array<string> = [];
    for(const key in origin_config){
        file_lines.push(`${key} = ${origin_config[key]}`);
    }
    fs.writeFileSync(config_path,file_lines.join(os.EOL));
    return true;
}

export async function runConfig(base_path:string,item?:string,content?:string){
    const config_path = path.resolve(base_path,'creat-template-config.env');
    let res;
    if(item&&!VALID_CONFIG_ITEM.includes(item)){
        console.log(`Error Config Match: ${red(item)}`)
        return false;
    }
    if(typeof content==='undefined'){
        res = readConfig(config_path,item);
        console.log(res);
    }else if(item&&content){
        if(content.includes('=')){
            console.log('Error format config env！')
            return false;
        }
        res = await injectConfig(config_path,item,content);
    }
    return res;
}