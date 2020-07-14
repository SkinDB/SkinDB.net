import { cfg } from '.';
import { SkinDBAccount, SkinDBSkin, SkinDBSearch, SkinDBIndex, SkinDBSkins } from './global';
import request from 'request';

const baseURL = cfg.spraxAPI.useUnixSocket ? `http://unix:${cfg.spraxAPI.unixSocketAbsolutePath}:` : 'https://api.sprax2013.de';

export async function getTopThisWeek(): Promise<SkinDBIndex> {
  return getFromAPI('index') as Promise<SkinDBIndex>;
}

export async function getAccount(uuid: string): Promise<SkinDBAccount> {
  return getFromAPI(`account/${encodeURIComponent(uuid)}`) as Promise<SkinDBAccount>;
}

export async function getSkin(skinID: string, accountID?: string): Promise<SkinDBSkin> {
  return getFromAPI(`skin/${encodeURIComponent(skinID)}?profile=${accountID || ''}`) as Promise<SkinDBSkin>;
}
export async function setTagVote(accountID: string, skinID: string, tag: string, vote: boolean | 'unset'): Promise<object> {
  return getFromAPI(`skin/${encodeURIComponent(skinID)}/vote`, 'POST', { user: accountID, tag, vote });
}

export async function getSkins(page: number | string): Promise<SkinDBSkins> {
  return getFromAPI(`skins?page=${encodeURIComponent(page)}`) as Promise<SkinDBSkins>;
}

export async function getSearch(query: string, page: number | string): Promise<SkinDBSearch> {
  return getFromAPI(`search?q=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}`) as Promise<SkinDBSearch>;
}

async function getFromAPI(urlSuffix: string, method: string = 'GET', body?: object | Buffer): Promise<object> {
  return new Promise((resolve, reject) => {

    request(`${baseURL}/skindb/frontend/${urlSuffix}`, {
      method, jar: true,
      headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined
    },
      (err, httpRes, body) => {
        if (err) return reject(err);

        const resBody = JSON.parse(body);
        console.log(resBody); // TODO: remove debug

        if (resBody.error && httpRes.statusCode != 200) return reject(resBody);

        return resolve(resBody);
      });
  });
}