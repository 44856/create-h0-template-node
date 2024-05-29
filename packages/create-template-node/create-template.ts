import * as fs from "fs-extra";
import * as path from "path";
import * as semver from "semver";
import * as process from "process";
import {Command} from "commander";
import {cyan, green, yellow} from "chalk";
import {AnyObj, COMMAND_TYPE} from "./types";
import {checkThatNpmCanReadCwd, isSafeToCreateProjectIn, readFileToObj, runConfig} from "./utils";

const packageJson = require("./package.json");

let base_path = path.resolve(__dirname);

export function init(){
    base_path = path.resolve(__dirname);
    const args:Array<string> = [];
    let other_args:AnyObj ={};
    const program = new Command(packageJson.name)
        .version(packageJson.version, '-v, --version', 'display the current version')
        .argument('<first-args>')
        .usage(`config`)
        .argument('[second-args...]')
        .usage(`${green('<first-args>')} ${green('[second-args]')} [options]`)
        .action((fist, second,options) => {
            args.push(fist,...second);
            other_args = options;
        })
        .option('-cli,--cli-version <string>', 'limit cli version,in hzeroJs or hzeroCli','hzeroJs')
        .option('--dir <string>', 'get template from the specified dir')
        .allowUnknownOption()
        .on('--help', () => {
            console.log(` You can input ${green('<app-name>')} and ${green('<template-name>')}\n`);
            console.log(` Or input config ${green('<config-item>')} ${green('<config-content>')} to set config \n`);
            console.log(` And you can get config by input config ${green('<config-item>')}} , ${green('<config-item>')} is optional,default print all \n`);
            console.log(` If you have any problems, do not hesitate to file an issue:`);
            console.log(`   ${cyan('https://github.com/44856/create-h0-template-node/issues/new')}`)
        })
        .parse(process.argv);
    checkArgs(program,args,other_args);
}

function checkArgs(program:Command,args:Array<string>,options:AnyObj){
    const [first_args,second_args,third_args] = args;
    const [first_args_type,second_args_type]
        = [typeof first_args,typeof second_args];
    if (first_args_type === 'undefined') {
        console.error(' Please specify the app name:');
        console.log(
            `  ${cyan(program.name())} ${green('<first-args>')} ${green('<second-args>')} \n`
        );
        console.log(
            ` Run ${cyan(`${program.name()} --help`)} to see all options.`
        );
        process.exit(1);
    }
    // 查询或配置配置项
    if(first_args.toLowerCase()===COMMAND_TYPE.CONFIG){
        runConfig(base_path,second_args,third_args).then(()=>{
            process.exit(0);
        });
    }else if (first_args.toLowerCase()!==COMMAND_TYPE.CONFIG&&typeof second_args_type === 'undefined') {
        console.error(' Please specify the template name:');
        console.log(
            `  ${cyan(program.name())} ${green('<second-args>')}\n`
        );
        console.log(' For example:');
        console.log(
            `  ${cyan(program.name())} ${green('<first-args>')} ${green('<second-args>')}`
        );
        console.log(
            ` Run ${cyan(`${program.name()} --help`)} to see all options.`
        );
        process.exit(1);
    }else{
        injectTemplate(first_args,second_args,options);
    }
}

function injectTemplate(appName: string, template: string,options:AnyObj){
    const unsupportedNodeVersion = !semver.satisfies(
        semver.coerce(process.version) || process.version,
        '>=14'
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

    const config_path = path.resolve(base_path,'creat-template-config.env');
    const config = readFileToObj(config_path);
    const mix_options = {
        ...config,
        ...options,
    }

    const originalDirectory = process.cwd();
    const root = path.resolve(originalDirectory);

    const pageDir = mix_options['page_dir']||'src/pages';
    const appPath = path.resolve(root, `${pageDir}/${appName}`);
    if (!fs.existsSync(pageDir)) {
        console.error('The directory structure is not right!');
        process.exit(1);
    }
    // 确保文件夹存在
    fs.ensureDirSync(appPath);
    if (!isSafeToCreateProjectIn(appPath)) {
        process.exit(1);
    }
    console.log(`\nInject code in ${green(appPath)}.\n`);
    run(root,appName,appPath,template,mix_options);
}

// TODO 插入路由
function injectRouteConfig(path:string,route:string) {

}

function run(
    root: string,
    appName: string,
    appPath:string,
    template: string,
    options:AnyObj,
){
    const option_dir = options['dir'];
    const templatePath = path.resolve(option_dir, template);
    if(!fs.existsSync(templatePath)){
        console.error(
            `Could not locate supplied template: ${green(templatePath)}`
        );
        process.exit(1);
    }
    try {
        fs.ensureDirSync(templatePath);
        fs.copySync(templatePath, appPath);
    }catch (e){
        console.error(e);
    }
    console.log(`   ${green('Finish')}`);
}