import { isArray, isObject } from "@vue/shared"
import { reactive } from "./reactive"
import { trackEffects, triggerEffects } from "./effect"

export function ref(value) {
  return new RefImpl(value)
}

function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}

class RefImpl {
  _value
  __v_isRef = true
  dep = new Set
  constructor(public rawValue) {
    this._value = toReactive(rawValue)
  }
  get value() {
    trackEffects(this.dep)
    return this._value
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this._value = toReactive(newValue)
      this.rawValue = newValue
      triggerEffects(this.dep)
    }
  }
}

class ObjectRefImpl {
  constructor(public object, public key) { }
  get value() {
    return this.object[this.key]
  }
  set value(newValue) {
    this.object[this.key] = newValue
  }
}

export function toRef(object, key) {
  return new ObjectRefImpl(object, key)
}

export function toRefs(object) {
  const obj = isArray(object) ? new Array(object.length) : {}
  for (const key in object) {
    obj[key] = toRef(object, key)
  }
  return obj
}

/** 自动访问 .value, 一般 Vue 在模板阶段自动使用 with 包裹少写一部分内容 */
export function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, receiver) {
      const r = Reflect.get(target, key, receiver).value
      return r.__v_isRef ?  r.value : r
    },
    set(target, key, newValue, receiver) {
      const oldValue = Reflect.get(target, key, receiver)
      let res = false
      if (oldValue.__v_isRef) {
        res = Reflect.set(oldValue, 'value', newValue, receiver)
      } else {
        res = Reflect.set(target, key, newValue, receiver)
      }
      return res
    }
  })
}
