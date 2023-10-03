import { ShapeFlag, isNullish, isString } from "@vue/shared"
import { Text, createVnode, isSameVnode } from "./vnode"

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
    const oldVnode = container?._vnode
    if (vnode && oldVnode) {
      patch(container._vnode, vnode, container)
    } else if (oldVnode) {
      // 之前渲染过, 执行卸载逻辑
      unmount(container._vnode)
    } else if (vnode) {
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
    } else {
      if (n1.children !== n2.children) {
        hostSetText(n2.el = n1.el, n2.children)
      }
    }
  }

  const processElement = (n1, n2, container) => {
    if (isNullish(n1)) {
      mountElement(n2, container)
    } else {

    }
  }

  const patch = (n1, n2, container) => {
    if (n1 === n2) return
    const { type, shapeFlag } = n2
    // 如果两次标签都不同, 则直接卸载后重新挂载
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1)
      n1 = null
    }
    switch (type) {
      case Text:
        processText(n1, n2, container)
        break;      
      default:
        if (shapeFlag & ShapeFlag.ELEMENT) {
          processElement(n1, n2, container)
        }
        break;
    }
  }

  return {
    render
  }
}