import path = require('path');
import ejs = require('ejs');

import { readFileSync } from 'fs';
import { SkinDBAccount, SkinDBSkin, SkinDBSearch, SkinDBIndex, SkinDBSkins } from './global';
import { Request } from 'express';
import { cfg } from '.';

const dynamicWebPath = path.join(__dirname, '..', 'resources', 'web', 'dynamic');

/**
 * Takes `host` and applies the choosen protocol from `cfg.web.urlPrefix.https`
 *
 * If the host is set to `auto`, host and port from `cfg.listen` are taken and used instead.
 * The port is automatically emitted when it is the default port for the choosen protocol
 *
 * @param host Should be `auto` or a hostname with optional port (`host[:port]`)
 */
function generateUrlPrefix(host: string | 'auto') {
  return `http${cfg.web.urlPrefix.https ? 's' : ''}://${
    host != 'auto' ? host : `${cfg.listen.host}${
      ((cfg.web.urlPrefix.https && cfg.listen.port != 443) ||
        (!cfg.web.urlPrefix.https && cfg.listen.port != 80)) ? `:${cfg.listen.port}` : ''}`}`;
}

export const global = {
  url: {
    base: generateUrlPrefix(cfg.web.urlPrefix.dynamicContentHost),
    static: generateUrlPrefix(cfg.web.urlPrefix.staticContentHost)
  }
};

const ejsSettings: { [key: string]: ejs.Options } = {
  LVL_ZERO: { delimiter: '%0' },  /* Used when inserting global, _HEAD, _HEADER, etc. */
  LVL_ONE: { delimiter: '%1' }, /* Used when inserting localization string */
  LVL_TWO: { delimiter: '%2' }  /* Used when inserting/generating dynamic content */
}

const _HEAD = ejs.render(readFileSync(path.join(dynamicWebPath, '_head.html'), 'utf-8'), { global }, ejsSettings.LVL_ZERO) as string,

  _HEADER = ejs.render(readFileSync(path.join(dynamicWebPath, '_header.html'), 'utf-8'), { global }, ejsSettings.LVL_ZERO) as string,
  _SEARCH = ejs.render(readFileSync(path.join(dynamicWebPath, '_search.html'), 'utf-8'), { global }, ejsSettings.LVL_ZERO) as string,
  _FOOTER = ejs.render(readFileSync(path.join(dynamicWebPath, '_footer.html'), 'utf-8'), { global }, ejsSettings.LVL_ZERO) as string;

export const PageParts: { [key: string]: string } = {
  INDEX: ejs.render(readFileSync(path.join(dynamicWebPath, 'index.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string,
  ACCOUNT: ejs.render(readFileSync(path.join(dynamicWebPath, 'account.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string,
  SKIN: ejs.render(readFileSync(path.join(dynamicWebPath, 'skin.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string,
  SKINS: ejs.render(readFileSync(path.join(dynamicWebPath, 'skins.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string,
  CAPE: ejs.render(readFileSync(path.join(dynamicWebPath, 'cape.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string,
  HISTORY: ejs.render(readFileSync(path.join(dynamicWebPath, 'history.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string,
  SEARCH: ejs.render(readFileSync(path.join(dynamicWebPath, 'search.html'), 'utf-8'), { global, _HEAD, _HEADER, _SEARCH, _FOOTER }, ejsSettings.LVL_ZERO) as string
}

interface PageData {
  account?: SkinDBAccount,
  skin?: SkinDBSkin,
  skins?: SkinDBSkins,
  search?: SkinDBSearch,
  index?: SkinDBIndex
};

//TODO: remove debug (default value for param pageData)
export function render(html: string, req: Request, pageData: PageData = {}): string {
  const currURL = global.url.base + (req.originalUrl.indexOf('?') >= 0 ? req.originalUrl.substring(0, req.originalUrl.indexOf('?')) : req.originalUrl);

  const data: { page: PageData, con: { query: { [key: string]: string }, isDarkTheme: boolean, isLoggedIn: boolean, session: object, url: string, urlEncoded: string } } = {
    page: pageData,
    con: {
      query: {},
      isDarkTheme: true,
      isLoggedIn: req.session && req.session.data,
      session: req.session ? req.session.data : null,
      url: currURL,
      urlEncoded: encodeURIComponent(currURL),
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