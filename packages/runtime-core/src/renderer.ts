import { ShapeFlag, isNullish, isString } from "@vue/shared"
import { Fragment, Text, createVnode, isSameVnode } from "./vnode"
import { getSequence } from "./sequence"

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

  function mountElement(vnode, container, anchor) {
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
    hostInsert(el, container, anchor)
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

  /** diff 算法
   * 核心为：多指针顺序比对, 映射表兜底, 乱序比对
   */
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    // sync from start, 新旧列表都从头开始比较
    // 出现第一个不一致的子元素或者任意一个到尾部结束
    while (i <= e1 && i <= e2) {
      if (isSameVnode(c1[i], c2[i])) {
        patch(c1[i], c2[i], el)
      } else {
        break
      }
      i++
    }
    // sync from end
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      e1--
      e2--
    }
    if (i > e1) {
      // common sequence 同序列挂载, 其他部分完全一样, 只有新增的部分在前或在后
      if (i <= e2) {
        while (i <= e2) {
          const nextPos = e2 + 1
          // 根据是否存在下一个元素来判断是插入还是追究
          const anchor = nextPos < c2.length ? c2[nextPos].el : null
          patch(null, c2[i++], el, anchor)
        }
      }
    } else {
      // 同序列删除
      if (i > e2) {
        while (i <= e1) {
          unmount(c1[i++])
        }
      }
    }
    /** 乱序比对 (三次循环)
     * 1. 记录 key -> index 映射表
     * 2. 更新新旧孩子差异
     * 3. 移动旧孩子位置
     */
    const s1 = i
    const s2 = i
    const keyToNewIndexMap = new Map()
    // 将新孩子差异部分的 key -> index 存入 map 中
    for (let i = s2; i <= e2; i++) {
      keyToNewIndexMap.set(c2[i].props?.key, i)
    }
    // 中间乱序元素的长度
    const toBePatched = e2 - s2 + 1
    // 记录已经 patch 过元素的原始下标
    const newIndexToOldIndex = new Array(toBePatched).fill(0)
    // 遍历旧孩子差异部分, 进行更新差异并维护 patch 过的记录数组
    for (let i = s1; i <= e1; i++) {
      const oldChild = c1[i]
      const newIndex = keyToNewIndexMap.get(oldChild.props?.key)
      if (newIndex) {
        newIndexToOldIndex[newIndex - s2] = i + 1
        patch(oldChild, c2[newIndex], el)
      } else {
        unmount(oldChild)
      }
    }
    // 获取最长递增子序列, [5, 3, 4, 0] -> [1, 2]
    let increment = getSequence(newIndexToOldIndex)
    let j = increment.length - 1
    // 移动元素位置, 倒叙插入 (因为 insert 方法只能向前插入)
    for (let i = toBePatched - 1; i >= 0; i--) {
      const index = i + s2
      const current = c2[index]
      const anchor = index + 1 > c2.length ? null : c2[index + 1].el
      // 如果没有 patch 过则肯定为新增元素
      if (newIndexToOldIndex[i] === 0) {
        patch(null, current, el, anchor)
      } else {
        // 跳过不需要移动的节点
        if (i !== increment[j]) {
          hostInsert(current.el, el, anchor)
        } else {
          j--
        }
      }
    }
    // 贪心、二分查找、前节点追溯
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
          patchKeyedChildren(c1, c2, el)
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

  /** 更新差异, 处理 vnode 对应的 element 属性与孩子 */
  const patchElement = (n1, n2) => {
    const el = n2.el = n1.el
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(el, oldProps, newProps)
    patchChildren(n1, n2, el)
  }

  const processFragment = (n1, n2, container) => {
    if (isNullish(n1)) {
      mountChildren(n2.children, container)
    } else {
      patchChildren(n1, n2, container)
    }
  }

  const processText = (n1, n2, container) => {
    if (isNullish(n1)) {
      hostInsert(n2.el = hostCreateText(n2.children), container)
    } else {
      if (n1.children !== n2.children) {
        hostSetText(n2.el = n1.el, n2.children)
      }
    }
  }

  const processElement = (n1, n2, container, anchor) => {
    if (isNullish(n1)) {
      mountElement(n2, container, anchor)
    } else {
      patchElement(n1, n2)
    }
  }

  /** 将 vnode 渲染到元素中 (处理渲染类型, 卸载旧节点) */
  const patch = (n1, n2, container, anchor = null) => {
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
      case Fragment:
        processFragment(n1, n2, container, anchor)
        break;      
      default:
        if (shapeFlag & ShapeFlag.ELEMENT) {
          processElement(n1, n2, container, anchor)
        }
        break;
    }
  }

  return {
    render
  }
}