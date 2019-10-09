const API = 'https://api.skindb.net';

const searchElem = document.getElementById('searchQuery'),
  skinPrevElem = document.getElementById('skinPreviews'),
  btnMoreSkins = document.getElementById('btnMoreSkins'),

  txtSearchTotalSkins = document.getElementById('totalSkins'),
  btnPrev = document.getElementById('btnPrev'),
  btnNext = document.getElementById('btnNext'),
  txtPageIndi = document.getElementById('pageIndicator'),

  skinModalElem = document.getElementById('skinModal'),
  mineskinPrevElem = document.getElementById('mineskinPreview'),
  btnApplySkin = document.getElementById('btnApplySkin'),
  btnDownloadSkin = document.getElementById('btnDownloadSkin');

const skinModalInstace = M.Modal.init(skinModalElem, { preventScrolling: false, onCloseEnd: dismissedSkinModal });

var lastSearch = '', currSearchPage = 1, currShowingRandomSkins = true;

onSearchInput = debounce(() => {
  if (lastSearch !== searchElem.value.trim()) {
    lastSearch = searchElem.value.trim();
    currSearchPage = 1;

    if (lastSearch) {
      skinPrevElem.innerHTML = '';

      currShowingRandomSkins = false;

      btnMoreSkins.classList.add('hide');

      btnNext.classList.remove('hide');
      btnPrev.classList.remove('hide');
      txtPageIndi.classList.remove('hide');
      txtSearchTotalSkins.classList.remove('hide');


      showSearchResults();
    } else {
      currShowingRandomSkins = true;

      btnNext.classList.add('hide');
      btnPrev.classList.add('hide');
      txtPageIndi.classList.add('hide');
      txtSearchTotalSkins.classList.add('hide');

      btnMoreSkins.classList.remove('hide');

      showRandomSkins();
    }
  }
}, 500);

function nextPage() {
  if (currShowingRandomSkins) return;

  currSearchPage++;
  showSearchResults();
}

function prevPage() {
  if (currShowingRandomSkins) return;

  if (currSearchPage > 1) {
    currSearchPage--;
    showSearchResults();
  }
}

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
}

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

                skinPrevElem.innerHTML += `<a class="skin-element col" href="#!${skin['ID']}" onClick="showSkin(${skin['ID']})"><img class="loading" onload="onLoadImg(this)" src="${skin.urls.render}"></a>`;
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
  skinPrevElem.innerHTML = '';
  txtSearchTotalSkins.innerText = '';
  pageIndicator.innerText = '';

  fetch(`${API}/search?count=12&page=${escape(currSearchPage)}&q=${escape(lastSearch)}`)
    .then((res) => {
      if (res.status === 200) {
        res.json()
          .then((json) => {
            let skins = json['results'];
            for (const key in skins) {
              if (skins.hasOwnProperty(key)) {
                const skin = skins[key];

                skinPrevElem.innerHTML += `<a class="skin-element col" href="#!${skin['ID']}" onClick="showSkin(${skin['ID']})"><img class="loading" onload="onLoadImg(this)" src="${skin.urls.render}"></a>`;
              }
            }

            let totalPages = Math.ceil(json['total'] / 12);

            if (currSearchPage <= 1) {
              btnPrev.classList.add('disabled');
            } else {
              btnPrev.classList.remove('disabled');
            }
            if (currSearchPage >= totalPages) {
              btnNext.classList.add('disabled');
            } else {
              btnNext.classList.remove('disabled');
            }

            pageIndicator.innerText = currSearchPage + ' / ' + totalPages;
            txtSearchTotalSkins.innerText = `Found ${json['total']} skins`;
          }).catch(console.error);
      } else {
        console.error('Non 200-StatusCode from API');
      }
    })
    .catch(console.error);
}

function showSkin(skinID) {
  // ToDo Check if skin exists
  let skinURL = encodeURIComponent(`https://cdn.skindb.net/skins/${skinID}/skin.png`);

  mineskinPrevElem.src = `https://minerender.org/embed/skin/?skin.url=${skinURL}&shadow=true&autoResize=true&controls.pan=false&controls.zoom=false&camera.target=[0,90,0]`;

  btnApplySkin.setAttribute('href', `https://my.minecraft.net/profile/skin/remote?url=${skinURL}`);
  btnDownloadSkin.setAttribute('href', `https://cdn.skindb.net/skins/${skinID}/skin.png`);
  btnDownloadSkin.setAttribute('download', `skin-${skinID}.png`);

  console.log('set page:', `/skinModal/${skinID}`);
  ga('set', 'page', `/${skinID}.html`);
  ga('send', 'pageview');

  skinModalInstace.open();
}

function dismissedSkinModal() {
  history.pushState('', document.title, window.location.pathname + window.location.search);

  console.log('set page:', '/');
  ga('set', 'page', '/');
  ga('send', 'pageview');

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