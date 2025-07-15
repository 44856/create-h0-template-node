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

- --dir 设置读取模板的路径，不按默认配置中的路径检索
- --route 设置读取路由模板的路径，不按默认配置中的路径检索
- --route-prefix 设置路由模板的前缀，一般为模块的缩写，如hofm

# 配置默认配置项

目前支持的配置信息为:

- dir 模板目录
- route 路由模板目录
- page_dir 页面功能相对路径，如 src/pages

```shell
create-template-h-node config <config-item> <config-content>
```

其中 <config-item> 可选值为 dir或route等,分别指代模板目录以及路由所在目录
比如
```shell
create-template-h-node config dir /dev/sda1/template
```
便是将模板路径设置为/dev/sda1/template,执行主命令行便会默认从该路径搜索模板文件

### 示例
```shell
dir = /dev/sda1/template
route = /dev/sda1/route
```


## 获取配置项信息

```shell
create-template-h-node config <config-item>
```

或

```shell
create-template-h-node config
```

# 模板配置信息 (将来实现自动注入配置需要的配置信息，现阶段不需要考虑)

## 初始化模板配置

```shell
create-template-h-node config template <template-name>
```

### 示例
```shell
configs = [config1,config2]; # 设置配置数目

config1:  # 设置对应配置的属性
# 文件路径限定为相对路径
page = ./index.ts; # 设置主文件路径
stores = ./stores/listDs.ts; # 设置对应的数据源路径
services = ./services.ts; # 设置接口调用方法的文件路径

config2:
... # 同上

```


# 注意事项

node 版本 >= 14

由于会对路由进行写入操作，所以命令执行完毕后请重新格式化一下文件，建议通过eslint+prettier辅助插件(一般项目上都已配置)进行代码格式化。