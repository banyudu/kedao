export const UniqueIndex = () => {

  if (isNaN(window.__KEDAO_MM_UNIQUE_INDEX__)) {
    window.__KEDAO_MM_UNIQUE_INDEX__ = 1
  } else {
    window.__KEDAO_MM_UNIQUE_INDEX__ += 1
  }

  return window.__KEDAO_MM_UNIQUE_INDEX__ 

}