export const isObject = (val: unknown): val is object => {
  return typeof val === 'object' && val !== null
}

export const isFunction = (
  val: unknown
): val is (...args: unknown[]) => unknown => {
  return typeof val === 'function'
}

export const isArray = (val: unknown): val is unknown[] => {
  return Array.isArray(val)
}

export const isString = (val: unknown): val is string => {
  return typeof val === 'string'
}

export const isNumber = (val: unknown): val is number => {
  return typeof val === 'number'
}

export const isNullish = (val: unknown): val is undefined|null => {
  return typeof val === 'undefined' || typeof val === null
}

export const enum ShapeFlag {
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlag.STATEFUL_COMPONENT | ShapeFlag.FUNCTIONAL_COMPONENT,
}
