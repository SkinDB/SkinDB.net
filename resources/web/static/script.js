function clearValue(elemID) {
  document.getElementById(elemID).value = '';
  console.log('cleared');

  updateInputClear(document.getElementById(elemID));
}

function onSearchInput(event) {
  updateInputClear(event.target);
}

function updateInputClear(inputElem) {
  for (const elem of inputElem.parentElement.querySelectorAll(`[onclick="clearValue('${inputElem.id}')"]`)) {
    if (inputElem.value) {
      elem.classList.remove('d-none');
    } else {
      elem.classList.add('d-none');
    }
  }
}

// Run on done rendering?
// updateInputClear(document.getElementById('search'));