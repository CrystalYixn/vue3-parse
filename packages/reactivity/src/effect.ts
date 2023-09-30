export let activeEffect = null

class ReactiveEffect {
  // ts 写法, 要求在 constructor 前在外边定义
  active = true
  // ts 写法, 会自动将 fn 挂载到 this 上
  constructor(public fn) { }

  /** 执行 effect */
  run() {
    // 非激活状态只需要执行函数, 不进行依赖收集
    if (!this.active) return this.fn()
    try {
      activeEffect = this
      return this.fn()
    } finally {
      activeEffect = null
    }
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}
