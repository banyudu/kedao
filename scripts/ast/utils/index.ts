
import { Project, SourceFile, Node, MethodDeclaration, FunctionDeclaration, ArrowFunction, ImportDeclaration, FunctionExpression } from 'ts-morph'
import * as path from 'path'

/**
 * get project from command line options
 */
export function getProject (): Project {
  return new Project({
    tsConfigFilePath: path.join(__dirname, '..', '..', '..', 'tsconfig.json')
  })
}

/**
 * Recursively walk all child nodes of given node, include self
 * @param node root node
 * @param callback callback function, return false to stop walk
 */
export function walk (node: Node, callback: (node: Node) => boolean): boolean {
  return _walk(node, callback, new Set())
}

function _walk (node: Node, callback: (node: Node) => boolean, parsed: Set<Node>): boolean {
  try {
    if (parsed.has(node) || node.compilerNode === null) {
      return false
    }
    parsed.add(node)
  } catch (error) {
    return false
  }

  const children = node.getChildren()

  // visit root node
  if (!callback(node)) {
    return false
  }

  // visit children, depth-first-search
  for (let i = 0; i < children.length; i++) {
    if (!_walk(children[i], callback, parsed)) {
      return false
    }
  }
  return true
}

export function getFunctions (file: SourceFile): Array<MethodDeclaration | FunctionDeclaration | ArrowFunction | FunctionExpression> {
  const functions: Array<MethodDeclaration | FunctionDeclaration | ArrowFunction | FunctionExpression> = []
  walk(file, (node) => {
    const checklist: any[] = [node]
    if (Node.isPropertyDeclaration(node)) {
      checklist.push(node.getInitializer())
    }
    if (Node.isExportAssignment(node)) {
      checklist.push(node.getExpression())
    }
    if (Node.isMethodDeclaration(node)) {
      // console.log(node.getBody()?.getText())
      checklist.push(node.getBody())
    }
    for (const item of checklist) {
      if ((Node.isMethodDeclaration(item) || Node.isFunctionDeclaration(item) || Node.isArrowFunction(item) || Node.isFunctionExpression(node))) {
        functions.push(item)
      }
    }
    return true
  })
  return functions
}

export function getImportDeclaration (sourceFile: SourceFile, includeFile: SourceFile, createIfNotExists: boolean = false): ImportDeclaration | undefined {
  const arr = sourceFile.getImportDeclarations().filter(
    item => item.getModuleSpecifierSourceFile() === includeFile
  ) ?? []
  let result
  if (arr.length > 0) {
    result = arr[0]
  }

  if (result === undefined && createIfNotExists) {
    let relativePath = path.relative(path.dirname(sourceFile.getFilePath().toString()), includeFile.getFilePath().toString())
    relativePath = relativePath.substring(0, relativePath.length - path.extname(relativePath).length)

    // 去除后缀名
    if (relativePath.endsWith('.ts') || relativePath.endsWith('.tsx')) {
      relativePath = path.basename(relativePath, path.extname(relativePath))
    }

    // 去除 /index 后缀
    if (relativePath.endsWith('/index')) {
      relativePath = relativePath.substring(0, relativePath.length - '/index'.length)
    }

    // 添加当前路径前缀
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath
    }
    result = sourceFile.insertImportDeclaration(0, { moduleSpecifier: relativePath, namedImports: [] })
  }
  return result as ImportDeclaration
}

export function camelToSnakeCase (str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

export function getFiles (): SourceFile[] {
  return getProject().getSourceFiles()
}

export function inspectNode (data: any | any[], withKindName?: boolean): void {
  if (!Array.isArray(data)) {
    data = [data]
  }
  data.forEach((item: any) => {
    console.log(item.getText())
    if (withKindName) {
      console.log(`    ${item.getKindName() as string}`)
    }
  })
}
