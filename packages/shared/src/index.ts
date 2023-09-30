export const isObject = (val: any): val is object => {
  return typeof val === 'object' && val !== null
}