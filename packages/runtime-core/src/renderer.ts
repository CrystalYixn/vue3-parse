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
  
  const normalize = (children, i) => {
    if (isString(children[i])) {
      const vnode = createVnode(Text, null, children[i])
      children[i] = vnode
    }
    return children[i]
  }

  const mountChildren = (children, container) => {
    children.forEach((child, i) => patch(null, normalize(children, i), container))
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

  const patchProps = (el, oldProps, newProps) => {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key],  newProps[key])
    }
    for (const key in oldProps) {
      if (isNullish(newProps[key])) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }

  const unmountChildren = (children) => {
    children.forEach(child => {
      unmount(child)
    })
  }

  const patchChildren = (n1, n2, el) => {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1
    const { shapeFlag, children: c2 } = n2
    
    // 新孩子是文本
    if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
      // 之前孩子是数组则删除旧的所有孩子
      if (prevShapeFlag & ShapeFlag.ARRAY_CHILDREN) {
        unmountChildren(c1)
      }
      // 设置文本
      if (c1 !== c2) {
        hostSetElementText(el, c2)
      }
    } else {
      // 新孩子是空或者数组
      // 之前孩子是是数组
      if (prevShapeFlag & ShapeFlag.ARRAY_CHILDREN) {
        // 新孩子也是数组则进入 diff
        if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {

        } else {
          // 新孩子是空则清空旧孩子
          unmountChildren(c1)
        }
      } else {
        // 新孩子是空
        // 之前孩子也是文本则清空旧内容
        if (prevShapeFlag & ShapeFlag.TEXT_CHILDREN) {
          hostSetElementText(el, '')
        }
        // 新孩子是数组
        if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
          mountChildren(c2, el)
        }
      }
    }
  }

  const patchElement = (n1, n2, container) => {
    const el = n2.el = n1.el
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(el, oldProps, newProps)
    patchChildren(n1, n2, el)
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
      patchElement(n1, n2, container)
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