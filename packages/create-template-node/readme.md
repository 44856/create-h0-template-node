# 使用方法

```shell
npm i -g create-template-h-node
create-template-h-node <app-name> <template-name> [options]
```

或者

```shell
npx create-template-h-node <app-name> <template-name> [options]
```

其中app-name指代页面文件夹名称，template-name则指代模板名称

## 可选项

- --template-version <string> 设置模板版本（目前版本未区分）
- -cli,--cli-version <string> 设置H0架构版本,目前版本有hzeroJs、hzeroCli,默认为hzeroJs

# 配置默认配置项

```shell
create-template-h-node config <config-item> <config-content>
```

## 获取配置项信息

```shell
create-template-h-node config <config-item>
```

或

```shell
create-template-h-node config
```

# 注意事项

node 版本 >= 14

由于会对路由进行写入操作，所以命令执行完毕后请重新格式化一下文件，建议通过eslint+prettier辅助插件(一般项目上都已配置)进行代码格式化。