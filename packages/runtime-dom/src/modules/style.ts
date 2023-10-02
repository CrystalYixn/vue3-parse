import { isNullish } from "@vue/shared"

export function patchStyle(el, prevValue, nextValue) {
  // QAA 为什么不能像 class 直接全量覆盖样式
  // 浏览器不允许直接修改 style 的引用指向, 只能通过访问具体的属性来修改
  // el.style = nextValue
  for (const key in nextValue) {
    el.style[key] = nextValue[key]
  }
  if (prevValue) {
    for (const key in prevValue) {
      if (isNullish(nextValue[key])) {
        el.style[key] = null
      }
    }
  }
}