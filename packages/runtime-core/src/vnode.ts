import { ShapeFlag, isArray, isString } from "@vue/shared";

export function isVnode(value) {
  return !!(value?.__v_isVnode)
}

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.props?.key === n2.props?.key
}

export function createVnode(type, props, children = null) {
  // 组合方案 shapeFlag, 利用位二进制和运算符可以快速进行类型的组合与包含判断
  let shapeFlag = isString(type) ? ShapeFlag.ELEMENT : 0
  const vnode = {
    type,
    props,
    children,
    el: null,
    __v_isVnode: true,
    shapeFlag,
  }
  if (children) {
    let type = 0
    if (isArray(children)) {
      type = ShapeFlag.ARRAY_CHILDREN
    } else {
      children = String(children)
      type = ShapeFlag.TEXT_CHILDREN
    }
    // 用一个值来表示多个语义, 此处表示 tag 的类型和孩子的类型
    // 原理是: 值作为一个二进制数据, 每一种类型都只将一位变成 1
    // 这样通过二进制运算符对指定位进行判断即可得出值是否包含某个类型
    vnode.shapeFlag |= type
  }

  return vnode
}