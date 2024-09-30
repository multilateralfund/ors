export function refocusMaskedInput(
  elReal: HTMLInputElement,
  elMask: HTMLInputElement,
) {
  function focusMaskOnInvalid() {
    elMask.focus()
  }

  elReal.addEventListener('invalid', focusMaskOnInvalid)

  return function () {
    elReal.removeEventListener('invalid', focusMaskOnInvalid)
  }
}
