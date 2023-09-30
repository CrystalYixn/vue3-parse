import { isObject } from "@vue/shared";
import { ReactiveFlags, mutableHandler } from "./baseHandlers";

/** weakMap 不会导致内存泄漏 */
const reactiveMap = new WeakMap()

/** 只能做对象的代理 */
export function reactive(target: any) {
  if (!isObject(target)) return
  // 防止重复响应式
  let proxy = reactiveMap.get(target)
  if (proxy) return proxy
  // 防止响应式嵌套响应式 (旧方案是建立一个双向 map, 通过传入的对象反向查找然后返回)
  if (target[ReactiveFlags.IS_REACTIVE]) return target
  proxy = new Proxy(target, mutableHandler)
  reactiveMap.set(target, proxy)
  return proxy
}
