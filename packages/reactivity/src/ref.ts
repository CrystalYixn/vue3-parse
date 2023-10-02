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
