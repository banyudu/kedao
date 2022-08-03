#!/usr/bin/env ts-node

/**
 * Convert scss to module.scss
 */

import { getProject, getJsxAttributes } from './utils'
import path from 'path'

const utilsPath = path.resolve(__dirname, '..', '..', 'src', 'utils', 'style');

(async () => {
  const project = getProject()
  const files = project.getSourceFiles()

  // 遍历文件列表
  for (const file of files) {
    let needCls = false

    // 修改 className 属性，改为从 css module 获取，同时保留原始类名用于样式覆盖
    const jsxAttrs = getJsxAttributes(file)
    for (let i = jsxAttrs.length - 1; i >= 0; i--) {
      const attr = jsxAttrs[i]
      const name = attr.getName()
      if (name === 'className') {
        const value = attr.getInitializer()?.getFullText()
        if (value) {
          let newValue = ''
          if (/^['"`]/.test(value)) {
            // 如果是字符串，则替换成 {cls(<原来的文本>)}的形式
            newValue = `{cls(${value})}`
            // } else if (/^\{.*\}$/.test(value)){
          } else {
            // 否则在大括号内插入 cls()
            newValue = `{cls(${value.slice(1, -1)})}`
          }
          if (newValue) {
            attr.getInitializer()?.replaceWithText(newValue)
            needCls = true
          }
        }
      }
    }

    if (needCls) {
      // 如果有 import './style.scss'，这样的引入语句，改成 import styles from './style.scss'
      file.getImportDeclarations().forEach((importDecl) => {
        const text = importDecl.getModuleSpecifier()?.getText()
        if (/\.scss["']?;?$/.test(text)) {
          const cssModule = text.replace(/\.scss/, '.module.scss')
          importDecl.replaceWithText(`import styles from ${cssModule}`)
        }
      })
      const utilsImportPath = path.relative(
        path.dirname(file.getFilePath().toString()),
        utilsPath
      )
      // console.log('utilsImportPath is: ', utilsImportPath)
      file.insertText(
        0,
        `
        import { classNameParser } from '${utilsImportPath}';
        const cls = classNameParser(styles);
      `
      )
    }
  }
  await project.save()
})().catch(console.error)
