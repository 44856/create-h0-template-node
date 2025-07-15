import * as os from "os";
import * as path from "path";
import * as fs from "fs-extra";
import * as process from "process";
import { green, yellow, red } from "chalk";
import { AnyObj } from "../types";
import { VALID_INJECT_CONFIG_ITEM } from "./constants";
import { readTxtToJsonLines } from "./utils";

// TODO 读取模板配置信息
export function readFileToObj(path: string) {
  const obj: AnyObj = Object.create(null);
  const exitEnv = fs.existsSync(path);
  if (!exitEnv) {
    return obj;
  }
  /* 配置读取得到结构如下
    {
      config1:{
        page:...,
        stores:..,
        services:...,
      }
    }
  */
  return obj;
}

// TODO 获取默认模板配置
async function exportInjectConfig(config_path: string) {
  const content: Array<string> = [
    'configs = [config1];',
    'config1:',
    'page = ./index.ts;',
    'stores = ./stores/listDs.ts;',
    'services = ./services.ts;',
  ];
  if (!fs.existsSync(config_path)) {
    try {
      fs.createFileSync(config_path);
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  fs.writeFileSync(config_path, content.join(os.EOL));
  return true;
}
