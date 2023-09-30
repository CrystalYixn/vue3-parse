import { track, trigger } from "./effect"

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandler = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return true
    track(target, 'get', key)
    // 会在属性取值时将 this 指向改为 receiver
    return Reflect.get(target, key, receiver)
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