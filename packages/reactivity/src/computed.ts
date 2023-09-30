import { isFunction } from "@vue/shared"
import { ReactiveEffect, trackEffects, triggerEffects } from "./effect"

class ComputedRefImpl {
  effect = null
  _dirty = true
  __v_isReadonly = true
  __v_isRef = true
  _value = null
  dep = new Set

  constructor(getter, public setter) {
    // 更新调度器在属性值被修改时触发
    this.effect = new ReactiveEffect(getter, () => {
      // 已经是脏的状态下则不需要重复通知, 如在通知外部调度器中又触发了更新, 避免死循环
      if (!this._dirty) {
        this._dirty = true
        // 通知依赖此属性的项更新
        triggerEffects(this.dep)
      }
    })
  }

  get value() {
    // 将访问当前值的 effect 收集起来
    trackEffects(this.dep)
    if (this._dirty) {
      this._value = this.effect.run()
      this._dirty = false
    }
    return this._value
  }

  set value(newVal) {
    this.setter(newVal)
  }
}

export const computed = (getterOrOptions) => {
  if (isFunction(getterOrOptions)) {
    return new ComputedRefImpl(getterOrOptions, () => {})
  } else {
    console.warn('暂不支持对象选项');
  }
}