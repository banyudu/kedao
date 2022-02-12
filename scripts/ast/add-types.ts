#!/usr/bin/env ts-node

/**
 * Add TreeWalker type to function paramsters if name == 'visitor' and untyped or is any type
 */

import { getProject, getFunctions, getImportDeclaration } from './utils'

interface ImportConfig {
  filePath: string
  typeName: string
  alias?: string
}

const importConfigMap: Record<string, ImportConfig> = {
  editor: {
    filePath: 'src/types/index.ts',
    typeName: 'CallbackEditor'
  },
  editorId: {
    filePath: null,
    typeName: 'string'
  },
  editorState: {
    filePath: 'src/types/index.ts',
    typeName: 'EditorState'
  }
}

;
(async () => {
  const project = getProject()
  const files = project.getSourceFiles()

  // 遍历文件列表
  for (const file of files) {
    const functions = getFunctions(file)
    const toImport: Set<ImportConfig> = new Set()

    // 遍历函数列表
    for (const func of functions) {
      const parameters = func.getParameters()

      // 遍历每个参数
      for (const param of parameters) {
        const config = importConfigMap[param.getName()]
        if (config && param.getType().getText() === 'any') {
          param.setType(config.alias ?? config.typeName)
          if (config.filePath) {
            toImport.add(config)
          }
        }
      }
    }

    const toImportFileMap: Record<string, ImportConfig[]> = Array.from(toImport).reduce((map: Record<string, ImportConfig[]>, config) => {
      map[config.filePath] = map[config.filePath] ?? []
      map[config.filePath].push(config)
      return map
    }, {})

    Object.keys(toImportFileMap).forEach(filePath => {
      if (!filePath) {
        return
      }

      // 获取import语句
      const fileToImport = project.getSourceFile(file => file.getFilePath().includes(filePath))
      const decl = getImportDeclaration(file, fileToImport, true)

      // 遍历需要添加的import
      const configs = toImportFileMap[filePath]

      configs.forEach(config => {
        const typeName = config.typeName
        const alias = config.alias ?? config.typeName
        if (!decl.getNamedImports().find(item => item.getNameNode().getText() === alias)) {
          decl.addNamedImport(typeName === alias ? typeName : { name: typeName, alias })
        }
      })
    })
  }
  await project.save()
})().catch(console.error)
