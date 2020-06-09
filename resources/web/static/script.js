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

function set3dSkin(skinID) {
  const imgElem = document.getElementById('skin3D'),
    imgURL = `https://api.sprax2013.de/mc/skin/x-url/body/3d?size=128&url=https://cdn.skindb.net/skins/${skinID}`;

  if (imgElem && imgElem.src != imgURL) {
    imgElem.src = '';

    const img = new Image();
    img.onload = () => imgElem.src = img.src;
    img.src = imgURL;
  }
}

// Run on done rendering?
// updateInputClear(document.getElementById('search'));