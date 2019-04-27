const API = 'https://api.skindb.net';

var currID = Number.parseInt(Cookies.get('lastSkinID')) || 1;

function saveSkinAndNext() {
  saveSkin();
  loadNextSkin();
}

function reloadSkin(skinJSON) {
  getSkinMeta(skinJSON['id'], (err, meta) => {
    if (err) {
      console.error(err);
      return M.toast({ html: err.message, classes: 'red darken' });
    }

    let skinURL = encodeURI(skinJSON['urls']['clean']);

    document.getElementById('skinName').innerText = currID;
    document.getElementById('skinPrev').src = `https://minerender.org/embed/skin/?skin.url=${skinURL}&shadow=true&autoResize=true&controls.pan=false&controls.zoom=false`;
    document.getElementById('skin3D').src = 'https://api.mineskin.org/render/skin?url=' + skinURL;

    // Form
    updateInput('formCharacterName', meta['CharacterName']);
    updateInput('formCharacterURL', meta['CharacterURL']);

    updateInput('formSkinOriginName', meta['SkinOriginName']);
    updateInput('formSkinOriginURL', meta['SkinOriginURL']);

    updateSelect('formSex', meta['Sex']);
    updateSelect('formAge', meta['Age']);

    updateInput('formWearsMask', meta['WearsMask']);
    updateInput('formMaskCharacterName', meta['MaskCharacterName']);
    updateInput('formMaskCharacterURL', meta['MaskCharacterURL']);

    updateInput('formWearsHat', meta['WearsHat']);
    updateInput('formHatType', meta['HatType']);

    updateSelect('formHairLength', meta['HairLength']);
    updateInput('formJob', meta['Job']);

    updateInput('formAccessories', meta['Accessories']);
    updateInput('formMiscTags', meta['MiscTags']);
  });
}


function loadNextSkin() {
  saveSkin();

  nextSkin((err, json) => {
    if (err) {
      console.error(err);
      return M.toast({ html: err.message, classes: 'red darken' });
    }

    reloadSkin(json);
  });
}

function loadPrevSkin() {
  saveSkin();

  prevSkin((err, json) => {
    if (err) {
      console.error(err);
      return M.toast({ html: err.message, classes: 'red darken' });
    }

    reloadSkin(json);
  });
}

function saveSkin() {
  const formElem = document.getElementById('skinForm');

  if (formElem.checkValidity()) {
    let json = {};

    for (const elem of formElem.getElementsByTagName('input')) {
      if (elem.id.startsWith('form')) {
        json[elem.id.substring(4)] = elem.type === 'checkbox' ? elem.checked : (elem.value || null);
      }
    }

    for (const elem of formElem.getElementsByTagName('select')) {
      if (elem.id.startsWith('form')) {
        json[elem.id.substring(4)] = elem.options[elem.selectedIndex].value || null;
      }
    }

    fetch(API + '/skin/' + currID + '/meta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json), cache: 'no-cache' })
      .then((res) => {
        if (res.status === 200) {
          M.toast({ html: 'Meta has been saved', classes: 'green' });
        } else {
          M.toast({ html: 'Non 200-StatusCode from API', classes: 'red darken' });
        }
      })
      .catch((err) => {
        console.error(err);

        M.toast({ html: 'Meta could not be saved', classes: 'red darken' });
      });
  } else {
    M.toast({ html: 'Form contains invalid values!', classes: 'red darken' });
  }
}

function getSkin(skinID, callback) {
  fetch(API + '/skin/' + skinID, { cache: 'no-cache' })
    .then((res) => {
      if (res.status !== 200) return callback(new Error('Non 200 Status from API'));

      res.json()
        .then((json) => { callback(null, json); })
        .catch((err) => { callback(err); });
    })
    .catch((err) => { callback(err); });
}

function nextSkin(callback) {
  currID++;
  Cookies.set('lastSkinID', currID, { expires: 730, path: '' });

  getSkin(currID, callback);
}

function prevSkin(callback) {
  if (currID > 1) {
    currID--;
    Cookies.set('lastSkinID', currID, { expires: 730, path: '' });
  }

  getSkin(currID, callback);
}

/**
 * @param {number} skinID
 * @param {Function} callback Params: err, json
 */
function getSkinMeta(skinID, callback) {
  fetch(API + '/skin/' + skinID + '/meta', { cache: 'no-cache' })
    .then((res) => {
      if (res.status !== 200) return callback(new Error('Non 200 Status from API'));

      res.json()
        .then((json) => { callback(null, json); })
        .catch((err) => { callback(err); });
    })
    .catch((err) => { callback(err); });
}

function updateInput(id, data) {
  let elem = document.getElementById(id);

  if (elem.type === 'checkbox') {
    elem.checked = data === true;
  } else {
    if (data == null) {
      elem.value = '';
      elem.labels[0].classList.remove('active');
    } else {
      elem.value = data || ' ';
      elem.labels[0].classList.add('active');
    }
  }
}

function updateSelect(id, data) {
  let elem = document.getElementById(id);

  let selectedIndex;
  if (data !== null) {
    for (selectedIndex = 0; selectedIndex < elem.options.length; selectedIndex++) {
      if (elem.options[selectedIndex].value === data.toString()) {
        break;
      }
    }
  }

  let instance = M.FormSelect.getInstance(elem);
  if (instance) {
    instance.destroy();
  }

  elem.selectedIndex = selectedIndex;
  M.FormSelect.init(elem);
}

// Load first skin
getSkin(currID, (err, json) => {
  if (err) {
    console.error(err);
    return M.toast({ html: err.message, classes: 'red darken' });
  }

  reloadSkin(json);
});