import { ShapeFlag, isNullish } from "@vue/shared"

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

  const render = (vnode, container) => {
    patch(null, vnode, container)
  }

  const mountChildren = (children, container) => {
    children.forEach(child => patch(null, child, container))
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

  const patch = (n1, n2, container) => {
    if (n1 === n2) return
    if (isNullish(n1)) {
      mountElement(n2, container)
    } else {

    }
  }

  return {
    render
  }
}