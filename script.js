const API = 'https://api.skindb.net';

const searchElem = document.getElementById('searchQuery'),
  skinPrevElem = document.getElementById('skinPreviews'),
  btnMoreSkins = document.getElementById('btnMoreSkins'),

  txtSearchTotalSkins = document.getElementById('totalSkins'),

  skinModalElem = document.getElementById('skinModal'),
  mineskinPrevElem = document.getElementById('mineskinPreview');

const skinModalInstace = M.Modal.init(skinModalElem, { preventScrolling: false, onCloseEnd: dismissedSkinModal });

var lastSearch = '', searchPage = 1, currShowingRandomSkins = false;

onSearchInput = debounce(() => {
  if (lastSearch !== searchElem.value.trim()) {
    lastSearch = searchElem.value.trim();
    searchPage = 1;

    if (lastSearch) {
      skinPrevElem.innerHTML = '';

      currShowingRandomSkins = false;

      btnMoreSkins.classList.add('hide');
      txtSearchTotalSkins.classList.remove('hide');

      showSearchResults();
    } else {
      currShowingRandomSkins = true;

      txtSearchTotalSkins.classList.add('hide');
      btnMoreSkins.classList.remove('hide');

      showRandomSkins();
    }
  }
}, 500);

function debounce(func, wait, immediate) {
  var timeout;

  return function () {
    var ctx = this;
    var args = arguments;

    var later = function () {
      timeout = null;
      if (!immediate) func.apply(ctx, args);
    };

    var callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func.apply(ctx, args);
  };
};

function onLoadImg(elem) {
  elem.classList.remove('loading');
}

function showRandomSkins() {
  btnMoreSkins.setAttribute('disabled', 'disabled');
  skinPrevElem.innerHTML = '';

  fetch(API + '/skin/random?count=12', { cache: 'no-cache' })
    .then((res) => {
      if (res.status === 200) {
        res.json()
          .then((json) => {
            for (const key in json) {
              if (json.hasOwnProperty(key)) {
                const skin = json[key];

                skinPrevElem.innerHTML += `<a class="skin-element col" href="#!${skin.id}" onClick="showSkin(${skin.id})"><img class="loading" onload="onLoadImg(this)" src="${skin.urls.render}"></a>`;
              }
            }

            btnMoreSkins.removeAttribute('disabled');
          }).catch(console.error);
      } else {
        console.error('Non 200-StatusCode from API');
      }
    })
    .catch(console.error);
}

function showSearchResults() {
  // btnMoreSkins.setAttribute('disabled', 'disabled');
  skinPrevElem.innerHTML = '';
  txtSearchTotalSkins.innerText = '';

  // ToDo: Show Total results, total pages, paginator

  fetch(`${API}/search?count=12&page=${escape(searchPage)}&q=${escape(lastSearch)}`)
    .then((res) => {
      if (res.status === 200) {
        res.json()
          .then((json) => {
            txtSearchTotalSkins.innerText = `Found ${json['total']} skins`;

            let skins = json['results'];
            for (const key in skins) {
              if (skins.hasOwnProperty(key)) {
                const skin = skins[key];

                skinPrevElem.innerHTML += `<a class="skin-element col" href="#!${skin.id}" onClick="showSkin(${skin.id})"><img class="loading" onload="onLoadImg(this)" src="${skin.urls.render}"></a>`;
              }
            }

            // btnMoreSkins.removeAttribute('disabled');
          }).catch(console.error);
      } else {
        console.error('Non 200-StatusCode from API');
      }
    })
    .catch(console.error);
}

function showSkin(skinID) {
  // ToDo Check if skin exists
  mineskinPrevElem.src = `https://minerender.org/embed/skin/?skin.url=https%3A%2F%2Fassets.skindb.net%2Fskins%2F${skinID}%2Fskin.png&shadow=true&autoResize=true&controls.pan=false&controls.zoom=false`;

  skinModalInstace.open();
}

function dismissedSkinModal() {
  history.pushState("", document.title, window.location.pathname + window.location.search);

  mineskinPrevElem.src = '';
}

function onHashChange() {
  if (window.location.hash && window.location.hash.startsWith('#!')) {
    let skinID = window.location.hash.substring(2);

    if (skinID) {
      skinID = Number.parseInt(skinID);

      if (Number.isSafeInteger(skinID)) {
        showSkin(skinID);
      }
    }
  }
}

window.addEventListener('hashchange', onHashChange);


onSearchInput();
if (currShowingRandomSkins) {
  showRandomSkins();
}

onHashChange();