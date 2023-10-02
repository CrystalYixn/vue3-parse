import { isArray, isObject } from "@vue/shared"
import { createVnode, isVnode } from "./vnode"

export function h(type, propsChildren, children) {
  const l = arguments.length
  if (l === 2) {
    if (isObject(propsChildren) && !isArray(propsChildren)) {
      if (isVnode(propsChildren)) {
        return createVnode(type, null, [propsChildren])
      }
      return createVnode(type, propsChildren)
    } else {
      return createVnode(type, null, propsChildren)
    } 
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2) 
    } else if (l === 3) {
      children = [children]
    }
    return createVnode(type, propsChildren, children)
  }
}