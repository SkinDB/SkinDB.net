import { cfg } from '.';
import { SkinDBAccount, SkinDBSkin, SkinDBSearch, SkinDBIndex } from './global';
import request from 'request';

const baseURL = cfg.spraxAPI.useUnixSocket ? `http://unix:${cfg.spraxAPI.unixSocketAbsolutePath}:` : 'https://api.sprax2013.de';

export async function getTopThisWeek(): Promise<SkinDBIndex> {
  return getFromAPI('index') as Promise<SkinDBIndex>;
}

export async function getAccount(uuid: string): Promise<SkinDBAccount> {
  return getFromAPI(`account/${encodeURIComponent(uuid)}`) as Promise<SkinDBAccount>;
}

export async function getSkin(skinID: string): Promise<SkinDBSkin> {
  return getFromAPI(`skin/${encodeURIComponent(skinID)}`) as Promise<SkinDBSkin>;
}

export async function getSearch(query: string): Promise<SkinDBSearch> {
  return getFromAPI(`search`, { query }) as Promise<SkinDBSearch>;
}

async function getFromAPI(urlSuffix: string, body?: object): Promise<object> {
  return new Promise((resolve, reject) => {


    request(`${baseURL}/skindb/frontend/${urlSuffix}`, {
      jar: true, gzip: true,
      headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined
    },
      (err, _httpRes, body) => {
        if (err) return reject(err);

        // TODO: Handle non 200-status

        console.log(JSON.parse(body));

        resolve(JSON.parse(body));
      });
  });
}