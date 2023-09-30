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
      clearEffect(this)
      return this.fn()
    } finally {
      // 很多东西没必要放在全局, 对象相关的流程逻辑尽量封装到对象内部实现
      // 从栈结构转换为了树结构, 减少全局污染
      // 每个对象只关心他的父亲而不关心栈里的其他 Effect , 所以逻辑更清晰
      activeEffect = this.parent
      this.parent = null
    }
  }

  stop() {
    if (this.active) {
      this.active = false
      clearEffect(this)
    }
  }
}

const targetMap = new WeakMap<object, Map<string, Set<ReactiveEffect>>>()

export function effect(fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
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
  let effects = depsMap.get(key)
  if (effects) {
    // 必须要创建一个新对象, 否则在循环过程中删除后又添加会导致死循环
    // 如: let s=new Set([0]);
    // s.forEach(i => {s.delete(0);s.add(0);console.log('6')});
    // 数组的 forEach 实现内部会创建一个拷贝, 不会死循环
    effects = new Set(effects)
    effects.forEach(e => {
      // 过滤在 effect 中重新触发当前 effect 的情况
      e !== activeEffect && e.run()
    })
  }
}

export function clearEffect(effect: ReactiveEffect) {
  const { deps } = effect
  // QAA 这样不是把其他 dep 中收集的此 effect 也删掉了吗
  // effect 中的 deps 仅收集 fn 中全部的 effect, 后续重新执行 fn 也重新收集了
  // 不存在不在 fn 中的属性引用了此 effect 的情况
  deps.forEach(dep => {
    // 删除 dep 中收集的 effect
    dep.delete(effect)
  })
  // 双向删除, 删除 effect 中依赖的 dep
  effect.deps.length = 0
}
