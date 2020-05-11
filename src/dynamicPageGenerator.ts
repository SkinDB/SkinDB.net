import path = require('path');
import ejs = require('ejs');

import { readFileSync } from 'fs';
import { SkinDBAccount, SkinDBSkin, SkinDBSearch, SkinDBIndex } from './global';
import { Request } from 'express';

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
  account?: SkinDBAccount,
  skin?: SkinDBSkin,
  search?: SkinDBSearch,
  index?: SkinDBIndex
};

//TODO: remove debug (default value for pageData)
export function render(html: string, req: Request, pageData: PageData = {}): string {
  const data: { page: PageData, con: { query: { [key: string]: string }, isDarkTheme: boolean, isLoggedIn: boolean, session: object, url: string } } = {
    page: pageData,
    con: {
      query: {},
      isDarkTheme: true,
      isLoggedIn: !!(req.session as any).data,
      session: (req.session as any).data,
      url: encodeURIComponent(global.url.base + (req.originalUrl.indexOf('?') >= 0 ? req.originalUrl.substring(0, req.originalUrl.indexOf('?')) : req.originalUrl))
    }
  }

  for (const key in req.query) {
    if (req.query.hasOwnProperty(key)) {
      const value = req.query[key];

      if (typeof value == 'string') {
        data.con.query[key] = value;
      }
    }
  }

  return ejs.render(html, data, ejsSettings.LVL_TWO) as string;
}