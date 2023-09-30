import { isObject } from "@vue/shared"
import { track, trigger } from "./effect"
import { reactive } from "./reactive"

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandler = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return true
    track(target, 'get', key)
    // Reflect 会在属性取值时将 this 指向改为 receiver
    const res = Reflect.get(target, key, receiver)
    if (isObject(res)) {
      // 在访问的属性是一个对象时才对这个对象做代理, 没有直接深度遍历, 优化了性能
      return reactive(res)
    }
    // 不能使用, 如果 target[key] 的值是一个访问器读取了 this 会导致无法监听
    // return target[key]
  },
  set(target, key, val, receiver) {
    const oldValue = target[key]
    // 返回一个布尔值声明赋值操作是否成功
    const result = Reflect.set(target, key, val, receiver)
    if (result && oldValue !== val) {
      trigger(target, 'set', key, val, oldValue)
    }
    return result
  }
}