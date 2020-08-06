const skinSettings3D = {
  skinID: null,
  render3D: true,
  render2ndLayer: true
};

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

/* 3D-Skin Render */
function toggle3d(elem) {
  skinSettings3D.render3D = !skinSettings3D.render3D;
  update3dSkin();

  if (!elem) return;
  if (skinSettings3D.render3D) {
    elem.classList.remove('btn-outline-danger');
    elem.classList.add('btn-outline-success');
  } else {
    elem.classList.remove('btn-outline-success');
    elem.classList.add('btn-outline-danger');
  }
}

function toggle2nd(elem) {
  skinSettings3D.render2ndLayer = !skinSettings3D.render2ndLayer;
  update3dSkin();

  if (!elem) return;
  if (skinSettings3D.render2ndLayer) {
    elem.classList.remove('btn-outline-danger');
    elem.classList.add('btn-outline-success');
  } else {
    elem.classList.remove('btn-outline-success');
    elem.classList.add('btn-outline-danger');
  }
}

function update3dSkin(skinID) {
  if (skinID) {
    skinSettings3D.skinID = skinID;
  }

  if (!skinSettings3D.skinID) return console.error('Can\'t update rendered Skin without knowing it\'s ID!');

  const imgElem = document.getElementById('skin3D'),
    imgURL = 'https://api.sprax2013.de/mc/skin/x-url/body' +
      (skinSettings3D.render3D ? '/3d' : '') +
      '?size=128&url=https://cdn.skindb.net/skins/' +
      skinSettings3D.skinID +
      (!skinSettings3D.render2ndLayer ? '&overlay=false' : '');

  if (imgElem && imgElem.src != imgURL) {
    imgElem.style.width = imgElem.clientWidth;
    imgElem.style.height = imgElem.clientHeight;
    imgElem.src = '';

    const img = new Image();
    img.onload = () => imgElem.src = img.src;

    img.src = imgURL;
    imgElem.style.removeProperty('width');
    imgElem.style.removeProperty('height');
  }
}

// Run on done rendering?
// updateInputClear(document.getElementById('search'));