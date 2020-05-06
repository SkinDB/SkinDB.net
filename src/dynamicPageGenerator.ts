import path = require('path');
import ejs = require('ejs');

import { readFileSync } from 'fs';
import { SkinDBAccount, SkinDBSkin, SkinDBSearch } from './global';

const dynamicWebPath = path.join(__dirname, '..', 'resources', 'web', 'dynamic');

// Put into config
export const global = {
  url: {
    base: 'http://localhost:8091',
    static: 'http://localhost:8091'
  }
};

const ejsSettings: { [key: string]: ejs.Options } = {
  LVL_ZERO: { delimiter: '%0' },  /* Used when inserting global, _HEAD, _HEADER, etc. */
  LVL_ONE: { delimiter: '%1' }, /* Used when inserting localization string */
  LVL_TWO: { delimiter: '%2' }  /* Used when inserting/generating dynamic content */
}

// TODO: remove debug
interface ejs_req {
  isDarkTheme: boolean,
  lang: { [key: string]: string }
}

const _HEAD = ejs.render(readFileSync(path.join(dynamicWebPath, '_head.html'), 'utf-8'), { global }, ejsSettings.LVL_ZERO) as string,

  _HEADER = ejs.render(readFileSync(path.join(dynamicWebPath, '_header.html'), 'utf-8'), { global }, ejsSettings.LVL_ZERO) as string,
  _SEARCH = ejs.render(readFileSync(path.join(dynamicWebPath, '_search.html'), 'utf-8'), { global }, ejsSettings.LVL_ZERO) as string,
  _FOOTER = ejs.render(readFileSync(path.join(dynamicWebPath, '_footer.html'), 'utf-8'), { global }, ejsSettings.LVL_ZERO) as string;

export const PageParts: { [key: string]: string } = {
  INDEX: ejs.render(readFileSync(path.join(dynamicWebPath, 'index.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string,
  ACCOUNT: ejs.render(readFileSync(path.join(dynamicWebPath, 'account.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string,
  SKIN: ejs.render(readFileSync(path.join(dynamicWebPath, 'skin.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string,
  CAPE: ejs.render(readFileSync(path.join(dynamicWebPath, 'cape.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string,
  HISTORY: ejs.render(readFileSync(path.join(dynamicWebPath, 'history.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string,
  SEARCH: ejs.render(readFileSync(path.join(dynamicWebPath, 'search.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string
}

interface PageData {
  page: {
    account?: SkinDBAccount,
    skin?: SkinDBSkin,
    search?: SkinDBSearch
  }
};

//TODO: remove debug (default value for data)
export function render(html: string, data: PageData = { page: {} }): string {
  return ejs.render(html, data, ejsSettings.LVL_TWO) as string;
}