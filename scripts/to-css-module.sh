#!/bin/bash

# 这个脚本用于将当前工程从 scss 转为 module.scss
# 需要提前安装 ts-node
ROOT_DIR="${BASH_SOURCE%/*}/.."
cd "$ROOT_DIR"

# 重命名 scss 文件为 module.scss 文件, inc.scss 除外
find src -name "*.scss" | grep -v 'inc.scss' | xargs rename 's/\.scss$/\.module\.scss/';

# 使用 ast 工具处理 ts 文件，修改引用路径及 className 用法
ts-node scripts/ast/convert-to-css-module.ts

# 使用 lint:fix 自动修复格式问题
npm run lint:fix-js -- --quiet
