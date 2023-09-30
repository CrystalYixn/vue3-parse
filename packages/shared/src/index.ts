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
