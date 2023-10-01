import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";

/** 深度遍历对象访问所有属性, 以便依赖收集 */
function traversal(value, set = new Set()) {
  if (!isObject(value)) return value
  // 处理循环引用, 自身的属性引用自身大对象
  if (set.has(value)) return value
  set.add(value)
  for (const k in value) {
    traversal(value[k])
  }
  return value
}

export function watch(source, cb) {
  let getter
  let oldValue
  let cleanup
  if (isFunction(source)) {
    getter = source
  } else {
    getter = () => traversal(source)
  }
  const job = () => {
    cleanup?.()
    const newValue = watchEffect.run()
    cb(newValue, oldValue, (fn) => {
      cleanup = fn
    })
    oldValue = newValue
  }
  const watchEffect = new ReactiveEffect(getter, job)
  oldValue = watchEffect.run()
  return watchEffect
}