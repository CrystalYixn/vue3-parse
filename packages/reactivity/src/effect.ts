export let activeEffect: ReactiveEffect | null = null

class ReactiveEffect {
  // ts 写法, 要求在 constructor 前在外边定义
  active = true
  parent = null
  // 需要双向记忆属性
  // 如 flag ? this.name : this.age 切换 flag 时清除另一方的收集使用
  deps = []
  // ts 写法, 会自动将 fn 挂载到 this 上
  constructor(public fn) { }

  /** 执行 effect */
  run() {
    // 非激活状态只需要执行函数, 不进行依赖收集
    if (!this.active) return this.fn()
    try {
      this.parent = activeEffect
      activeEffect = this
      return this.fn()
    } finally {
      // 很多东西没必要放在全局, 对象相关的流程逻辑尽量封装到对象内部实现
      // 从栈结构转换为了树结构, 减少全局污染
      // 每个对象只关心他的父亲而不关心栈里的其他 Effect , 所以逻辑更清晰
      activeEffect = this.parent
      this.parent = null
    }
  }
}

const targetMap = new WeakMap<object, Map<string, Set<ReactiveEffect>>>()

export function effect(fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

export function track(target, type, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  const shouldTrack = !dep.has(activeEffect)
  if (shouldTrack) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

export function trigger(target, type, key, value, oldValue) {
  const depsMap = targetMap.get(target)
  // 未被收集的响应式属性不处理
  if (!depsMap) return
  const effects = depsMap.get(key)
  effects?.forEach(e => {
    // 过滤在 effect 中重新触发当前 effect 的情况
    e !== activeEffect && e.run()
  })
}

console.log(targetMap)
