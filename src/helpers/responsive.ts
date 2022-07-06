import { UniqueIndex } from '../utils'

let resizeEventHandlers = []
let responsiveHelperInited = false
let debouce: any = false

export default {
  resolve (eventHandler) {
    const id = UniqueIndex()
    resizeEventHandlers.push({ id, eventHandler })
    return id
  },

  unresolve (id) {
    resizeEventHandlers = resizeEventHandlers.filter((item) => item.id !== id)
  }
}

if (!responsiveHelperInited && typeof window === 'object') {
  window.addEventListener('resize', (event) => {
    clearTimeout(debouce)
    debouce = setTimeout(() => {
      resizeEventHandlers.map((item) => {
        if (typeof item.eventHandler === 'function') {
          item.eventHandler(event)
          return true
        }
        return false
      })
      debouce = false
    }, 100)
  })

  responsiveHelperInited = true
}
