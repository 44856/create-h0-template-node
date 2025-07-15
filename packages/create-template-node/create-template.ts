import * as fs from "fs-extra";
import * as path from "path";
import * as semver from "semver";
import * as process from "process";
import { Command } from "commander";
import { cyan, green, red, yellow } from "chalk";
import generator from "@babel/generator";
import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import { CallExpression, VariableDeclaration } from "@babel/types";
import { AnyObj, COMMAND_TYPE } from "./types";
import {
  checkThatNpmCanReadCwd,
  isSafeToCreateProjectIn,
  readFileToObj,
  runConfig,
} from "./utils";
import { CLI_VERSION } from "./utils/constants";
import { injectObj } from "./utils/utils";

const packageJson = require("./package.json");
const enquirer = require("enquirer");

let base_path = path.resolve(__dirname);

let is_debug = false;

export function init() {
  base_path = path.resolve(__dirname);
  const args: Array<string> = [];
  let other_args: AnyObj = {};
  const program = new Command(packageJson.name)
    .version(
      packageJson.version,
      "-v, --version",
      "display the current version"
    )
    .argument("<first-args>", "第一个必需参数")
    .argument("[second-args...]", "可选的多个参数")
    .usage(`${green("<first-args>")} ${green("[second-args...]")} [options]`)
    .action((fist, second, options) => {
      args.push(fist, ...second);
      other_args = options;
    })
    .option(
      "-cli,--cli-version <string>",
      "limit cli version,in hzeroJs or hzeroCli",
      "hzeroJs"
    )
    .option("--dir <string>", "get template from the specified dir")
    .option("--route <string>", "get route file from the specified dir")
    .option("--route-prefix <string>", "set route prefix")
    .option("--debug <bool>", "set flag to debug")
    .allowUnknownOption()
    .on("--help", () => {
      console.log(
        ` You can input ${green("<app-name>")} and ${green(
          "<template-name>"
        )}\n`
      );
      console.log(
        ` Or input config ${green("<config-item>")} ${green(
          "<config-content>"
        )} to set config \n`
      );
      console.log(
        ` And you can get config by input config ${green(
          "<config-item>"
        )} , ${green("<config-item>")} is optional,default print all \n`
      );
      console.log(
        ` If you have any problems, do not hesitate to file an issue:`
      );
      console.log(
        `   ${cyan(
          "https://github.com/44856/create-h0-template-node/issues/new"
        )}\n`
      );
    })
    .parse(process.argv);
  is_debug = Boolean(other_args.debug);
  if (is_debug) {
    console.log(`\n  Run on argv,${green(args.join(","))}\n`);
    console.log("options", other_args.toString());
  }
  checkArgs(program, args, other_args);
}

function checkArgs(program: Command, args: Array<string>, options: AnyObj) {
  const [first_args, second_args, third_args] = args;
  const [first_args_type, second_args_type] = [
    typeof first_args,
    typeof second_args,
  ];
  if (first_args_type === "undefined") {
    console.error(" Please specify the app name:");
    console.log(
      `  ${cyan(program.name())} ${green("<first-args>")} ${green(
        "<second-args>"
      )} \n`
    );
    console.log(
      ` Run ${cyan(`${program.name()} --help`)} to see all options.\n`
    );
    process.exit(1);
  }
  // 查询或配置配置项
  if (first_args.toLowerCase() === COMMAND_TYPE.CONFIG) {
    if (is_debug) {
      console.log(`   Run to check or set ${yellow("Config")}\n`);
    }
    runConfig(base_path, second_args, third_args).then(() => {
      process.exit(0);
    });
  } else if (
    first_args.toLowerCase() !== COMMAND_TYPE.CONFIG &&
    second_args_type === "undefined"
  ) {
    /*     console.error(" Please specify the template name:");
    console.log(`  ${cyan(program.name())} ${green("<second-args>")}\n`);
    console.log(" For example:");
    console.log(
      `  ${cyan(program.name())} ${green("<first-args>")} ${green(
        "<second-args>"
      )}`
    );
    console.log(
      ` Run ${cyan(`${program.name()} --help`)} to see all options.\n`
    );
    process.exit(1); */
    injectBySelectTemplate(first_args, options);
  } else {
    injectTemplate(first_args, second_args, options);
  }
}

async function injectBySelectTemplate(appName: string, options: AnyObj) {
  const config_path = path.resolve(base_path, "creat-template-config.env");
  const exitEnv = fs.existsSync(config_path);
  if (!exitEnv) {
    console.error(" The env file doesn't exit !");
    process.exit(1);
  }
  const config = readFileToObj(config_path);
  const templateDir = path.resolve(config.dir);
  const dirList = fs.readdirSync(templateDir);
  try {
    const selected:any = await enquirer.prompt([
      {
        type: "select",
        name: "selectedTemplate",
        message: "Please select template: ",
        choices: dirList.map((name) => ({ name })),
      },
    ]);
    injectTemplate(appName, selected.selectedTemplate, options);
  } catch (err) {
    console.error("交互选择取消或出错，命令终止");
    process.exit(1);
  }
}

async function injectPacakagesBySelect(pathName:string) {
  const dirList = fs.readdirSync(pathName,{withFileTypes:true});
  try {
    const selected:any = await enquirer.prompt([
      {
        type: "select",
        name: "package",
        message: "Please select package: ",
        choices: dirList.filter((item)=>item.isDirectory()).map((item) => ({ name:item.name })),
      },
    ]);
    return selected.package;
  } catch (err) {
    console.error("交互选择取消或出错，命令终止");
    process.exit(1);
  }
}

async function injectTemplate(appName: string, template: string, options: AnyObj) {
  const unsupportedNodeVersion = !semver.satisfies(
    semver.coerce(process.version) || process.version,
    ">=14"
  );
  if (unsupportedNodeVersion) {
    console.log(
      yellow(
        `You are using Node ${process.version} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
          `Please update to Node 14 or higher for a better, fully supported experience.\n`
      )
    );
  }

  if (!checkThatNpmCanReadCwd()) {
    process.exit(1);
  }

  const config_path = path.resolve(base_path, "creat-template-config.env");
  const config = readFileToObj(config_path);
  if (is_debug) {
    console.log(`  Get ${yellow("Config")} to Inject: \n`);
    console.log(`\n    ${JSON.stringify(config)}\n`);
  }
  const mix_options = {
    ...config,
    ...options,
  };
  if (is_debug) {
    console.log(`  After mix: \n`);
    console.log(`\n    ${JSON.stringify(mix_options)}\n`);
  }
  const originalDirectory = process.cwd();
  const root = path.resolve(originalDirectory);

  const pageDir = mix_options["page_dir"] || "src/pages";
  let appPath = path.resolve(root, `${pageDir}/${appName}`);
  if (!fs.existsSync(pageDir)) {
    console.log(` Now pwd run under ${green(root)}\n`);
    const packagesPath = path.resolve(root,'packages');
    if(!fs.existsSync(packagesPath)){
      console.error(" The root directory structure is not right!\n");
      process.exit(1);
    }else{
      const packageName = await injectPacakagesBySelect(packagesPath);
      appPath =  path.resolve(root, `packages/${packageName}/${pageDir}/${appName}`);
    }
  }
  // 确保文件夹存在
  fs.ensureDirSync(appPath);
  if (!isSafeToCreateProjectIn(appPath)) {
    process.exit(1);
  }
  console.log(`\n  Inject code in ${green(appPath)}.\n`);
  run(root, appName, appPath, template, mix_options);
}

function processInjectRouteConfig(
  path: string,
  route_code: string,
  version: string
) {
  const origin_route_code = fs.readFileSync(path, "utf-8");
  const ast = parse(origin_route_code, {
    sourceType: "unambiguous",
    plugins: ["typescript"],
  });
  const routeObj = JSON.parse(route_code);
  // 区分架构版本注入路由参数
  version = version.toUpperCase();
  const routeName = version === CLI_VERSION.HZEROJS ? "routes" : "config";
  const visitor =
    version === CLI_VERSION.HZEROJS
      ? {
          CallExpression(path: NodePath<CallExpression>) {
            const node = path.node;
            if (!node) {
              return;
            }
            const argument = node.arguments[0];
            const { properties = [] } = argument as any;
            const target = properties.find(
              (item: any) => item.key && item.key.name === routeName
            );
            if (!target) {
              return;
            }
            target.value.elements.push(injectObj(routeObj));
          },
        }
      : {
          VariableDeclaration(path: NodePath<VariableDeclaration>) {
            const node = path.node;
            if (!node) {
              return;
            }
            const { declarations = [] } = node;
            const target = declarations.find(
              (item: any) => item.id && item.id.name === routeName
            );
            if (!target) {
              return;
            }
            if (target.init?.type === "ArrayExpression") {
              target.init.elements.push(injectObj(routeObj));
            }
          },
        };
  traverse(ast, visitor);
  return generator(ast, {}, origin_route_code);
}

// 插入路由
function injectRouteConfig(path: string, route_code: string, version: string) {
  try {
    const code = processInjectRouteConfig(path, route_code, version).code;
    fs.writeFileSync(path, code.replace(/\"/g, "'"), "utf-8");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

// TODO 自动注入配置信息对应的数据
function injectTemplateConfig(templatePath:string,injectConfigPath:string){
  
}

function run(
  root: string,
  appName: string,
  appPath: string,
  template: string,
  options: AnyObj
) {
  const option_dir = options["dir"];
  const templatePath = path.resolve(option_dir, template);
  if (!fs.existsSync(templatePath)) {
    console.error(
      `Could not locate supplied template: ${green(templatePath)}\n`
    );
    process.exit(1);
  }
  if (is_debug) {
    console.log(`  Inject Template: \n`);
    console.log(`   ${option_dir}\\${green(template)}\n`);
  }
  // 复制模板
  try {
    fs.ensureDirSync(templatePath);
    fs.copySync(templatePath, appPath);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
  // 注入路由
  let cliVersion = options.cli || options.cliVersion;
  let routeFilePath;

  if (!cliVersion) {
    routeFilePath = "";
  } else {
    cliVersion = cliVersion.toUpperCase();
    routeFilePath =
      cliVersion === CLI_VERSION.HZEROJS
        ? "config/config.ts"
        : "src/config/routers.ts";
  }

  const route_path = options["route"] || path.resolve(root, routeFilePath);

  if (!route_path) {
    console.error(`Wrong Empty Route Path!\n`);
    process.exit(1);
  }
  const templateConfigPath = path.resolve(templatePath, "config.json");
  if (!fs.existsSync(route_path) || !fs.existsSync(templateConfigPath)) {
    console.error(` The route file lost, ${red("Fail To Inject Route")}!\n`);
  } else {
    const code = fs.readFileSync(templateConfigPath, "utf-8");
    let injectCode = code.replace(/{appName}/g, appName);
    const route_prefix = options["routePrefix"];
    if (route_prefix) {
      injectCode = injectCode.replace(/{route_prefix}/g, route_prefix);
    }
    if (is_debug) {
      console.log(`  Inject Route Config: \n`);
      console.log(`\n${injectCode}\n\n`);
    }
    if (
      cliVersion === CLI_VERSION.HZEROJS ||
      cliVersion === CLI_VERSION.H0CLI
    ) {
      injectRouteConfig(route_path, injectCode, cliVersion);
    } else {
      // 未知脚手架注入则默认将内容写入到文件底部
      if (is_debug) {
        console.log(` Run On Unknown CLI ${yellow(cliVersion)}\n`);
      }
      fs.writeFileSync(route_path, injectCode);
    }
    // 移除路由配置文件
    fs.removeSync(path.resolve(appPath, "config.json"));
  }
  console.log(`   ${green("Finish")}\n`);
}
