function createInvoker(cb) {
  const invoker = (e) => invoker.value(e)
  invoker.value = cb
  return invoker
}

export function patchEvent(el, eventName, nextValue) {
  // 性能优化, 绑定一个自定义事件, 而不是移除事件后再重新绑定用户定义的事件
  const invokers = el.vei || (el.vei = {})
  const exits = invokers[eventName]
  const formatEvent = eventName.slice(2).toLowerCase()

  if (exits && nextValue) {
    // 缓存过, 更换新的绑定函数
    exits.value = nextValue
  } else if (nextValue) {
    // 没缓存过
    const invoker = createInvoker(nextValue)
    invokers[eventName] = invoker
    el.addEventListener(formatEvent, invoker)
  } else if (exits) {
    // 缓存过, 但新绑定的函数为空
    el.removeEventListener(formatEvent)
    invokers[formatEvent] = null
  }
}