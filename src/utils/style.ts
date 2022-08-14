export const classNameParser =
  (styles: Record<string, string>) => (className: string | null) => {
    const originalClassNames = className?.split(' ').filter(Boolean) ?? []
    const newClassNames = originalClassNames
      .map((e) => styles[e])
      .filter(Boolean)
    return originalClassNames.concat(newClassNames).join(' ')
  }
