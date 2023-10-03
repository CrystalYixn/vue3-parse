import { ShapeFlag, isNullish, isString } from "@vue/shared"
import { Text, createVnode } from "./vnode"

/** 创建一个渲染器, 渲染器本身与平台无关, 接收传入的平台操作实现作为入参 */
export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createElement: hostCreateElement,
    createText: hostCreateText,
    patchProp: hostPatchProp,
  } = renderOptions

  const unmount = (vnode) => {
    hostRemove(vnode.el)
  }

  const render = (vnode, container) => {
    // 之前渲染过, 执行卸载逻辑
    if (isNullish(vnode) && container?._vnode) {
      unmount(container._vnode)
    } else {
      patch(null, vnode, container)
    }
    container._vnode = vnode
  }
  
  const normalize = (child) => {
    if (isString(child)) {
      return createVnode(Text, null, child)
    }
    return child
  }

  const mountChildren = (children, container) => {
    children.forEach(child => patch(null, normalize(child), container))
  }

  function mountElement(vnode, container) {
    const { type, props, shapeFlag, children } = vnode
    const el = vnode.el = hostCreateElement(type)
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }
    hostInsert(el, container)
  }

  const processText = (n1, n2, container) => {
    if (n1 === null) {
      hostInsert(n2.el = hostCreateText(n2.children), container)
    }
  }

  const patch = (n1, n2, container) => {
    if (n1 === n2) return
    const { type, shapeFlag } = n2
    if (isNullish(n1)) {
      switch (type) {
        case Text:
          processText(n1, n2, container)
          break;      
        default:
          if (shapeFlag & ShapeFlag.ELEMENT) {
            mountElement(n2, container)
          }
          break;
      }
    } else {

    }
  }

  return {
    render
  }
}