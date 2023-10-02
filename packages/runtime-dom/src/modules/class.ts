import { isNullish } from "@vue/shared"

export function patchClass(el, nextValue) {
  if (isNullish(nextValue)) {
    el.removeAttribute('class')
  } else {
    el.className = nextValue
  }
}