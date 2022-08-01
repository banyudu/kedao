# 欢迎参与 kedao 项目

欢迎任何形式的贡献，可以是编码、文档，或 issue、discussion 等。

下面做一些基本的介绍：

## 项目背景、现状及目标

本项目源于 [braft-editor](https://github.com/margox/braft-editor)，因为 braft-editor 项目已经停止维护，遂 fork 新的仓库单独维护。

需要注意的是，braft-editor 及 kedao 都是基于 [draft-js](https://www.npmjs.com/package/draft-js) 的，而 draft-js 已经有两年不更新了。

Draft-js 提供的是编辑器的内核，而 BraftEditor / Kedao 在它的基础之上，提供了工具栏和各种工具函数，包装成开箱即用的形式。

目前，kedao 完成了项目的依赖升级(react / draft-js 等)、技术栈升级(Typescript)，输出产物重构等各项优化，使它能够更容易地嵌入在主流框架中使用。

短期来看，kedao 的目标是支持更多的框架，做一些架构优化，并梳理规范的 API 等。

## 开发指南

Kedao 的技术栈为 React (Hooks) + Typescript，使用 [pnpm](https://pnpm.io/) 管理依赖。

### 目录结构

```bash
├── docs # 文档网站，基于 docusaurus 实现。同时也可作为 docusaurus 示例
├── examples # 示例项目
│   ├── with-cra # CRA 项目示例
├── scripts # 一次性脚本，存储一些在重构过程中使用的 AST 处理脚本
├── src
│   ├── components # 组件
│   ├── configs # 配置
│   ├── editor # 编辑器主体
│   ├── extensions # 扩展工具
│   ├── finder # 多媒体选择器
│   ├── languages # 多语言
│   ├── utils # 工具方法
└── tsconfig.json
```

### 开启调试

要开启调试的话，可以通过如下的方式：

1. 执行 `npm run build:watch` 启动调试，会启动 watch 模式实时编译源码到 `lib` 目录。
1. 进入到 `examples/with-cra` 或其它的 example 目录，或 `docs` 目录，均可以加载到步骤 1 中的产物，开启调试。

### 分支说明

项目计划采用如下的分支管理模式：

- main 分支，用于维护当前主要版本的代码。适合于处理 bugfix，添加非破坏性更新等。
- next 分支，用于维护下个主版本的代码，可以不断地加入破坏性更新，直到评估稳定后合并到 main 分支，成为主要版本。
- v\* 版本，如 v0 / v1 等，代表旧的主要版本的代码。每次 next 分支合并 main 分支之前，需要用原来的 main 分支 fork 一个新的 v\* 分支。

### 版本说明

- main 分支中每一次对功能有影响的提交，都会自动触发 npm 发布，只要测试通过就会正常发布。
- next 分支暂时不会自动发布 npm 包，但会触发 vercel 自动构建，所以一样可以及时预览。
- v\* 分支每一次提交也会触发 npm 发布，用旧的大版本号。

## 协作指南

因为目前参与开发的人还不太多，暂时不适合用 IM 沟通，有问题直接提 issue / discussion 即可。

有些任务的工作量比较大，为了避免重复开发，可以先提 issue 并分配到自己名下。
