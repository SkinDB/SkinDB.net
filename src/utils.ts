import crypto = require('crypto');
import request = require('request');

import { EOL } from 'os';
import { Request, Response } from 'express';

import { errorLogStream, cfg, appVersion } from '.';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  UUID_PATTERN_ADD_DASH = /(.{8})(.{4})(.{4})(.{4})(.{12})/;

export class ApiError extends Error {
  readonly httpCode: number;
  readonly details?: { param: string, condition: string }[];
  logged: boolean;

  static discordHookCounter: number = 0;

  constructor(message: string, httpCode: number, details?: { param: string, condition: string }[], logged?: boolean) {
    super(message);

    this.httpCode = httpCode;
    this.details = details;
    this.logged = logged || false;
  }

  static fromError(err: Error): ApiError {
    return new ErrorBuilder().log(err.message, err.stack).unknown();
  }

  static async log(msg: string, obj?: any, skipWebHook: boolean = false) {
    const stack = new Error().stack;

    console.error('An error occurred:', msg, typeof obj != 'undefined' ? obj : '', process.env.NODE_ENV != 'production' ? stack : '');

    if (errorLogStream) {
      errorLogStream.write(`[${new Date().toUTCString()}] ${JSON.stringify({ msg, obj, stack })}` + EOL);
    }

    // Contact Discord-WebHook
    if (!skipWebHook && ApiError.discordHookCounter < 8 && cfg && cfg.logging.discordErrorWebHookURL && cfg.logging.discordErrorWebHookURL.toLowerCase().startsWith('http')) {
      ApiError.discordHookCounter++;

      request.post(cfg.logging.discordErrorWebHookURL, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `SpraxAPI/${appVersion}`,
          Accept: 'application/json'
        },
        body: JSON.stringify({
          username: 'SpraxAPI (Error-Reporter)',
          avatar_url: 'https://cdn.discordapp.com/attachments/611940958568841227/684083067073200138/SpraxAPI-4096px.png',
          embeds: [
            {
              title: 'An error occurred',
              fields: [
                {
                  name: 'Message',
                  value: msg
                },
                {
                  name: 'Object',
                  value: obj != undefined ? '```JS\n' + JSON.stringify(obj, null, 2) + '\n```' : 'Empty'
                }
              ]
            }
          ]
        })
      }, (err: Error, res, body) => {
        if (err) return ApiError.log('Could not execute Discord-WebHook', { msg: err.message }, true);
        if (res.statusCode != 204) return ApiError.log(`Could not execute Discord-WebHook: ${body}`, undefined, true);
      });
    }
  }
}
setInterval(() => ApiError.discordHookCounter = 0, 60 * 1000);

export class ErrorBuilder {
  logged: boolean = false;

  constructor() { }

  log(msg: string, obj?: any): this {
    ApiError.log(msg, obj);
    this.logged = true;

    return this;
  }

  unknown(): ApiError {
    return new ApiError('An unknown error occurred', 500, undefined, this.logged);
  }

  notFound(whatCouldNotBeFound: string = 'The requested resource could not be found', adminLog?: string | boolean): ApiError {
    if (adminLog) {
      this.log(typeof adminLog == 'boolean' ? `This should not have happened: ${whatCouldNotBeFound}` : adminLog);
    }

    return new ApiError(`${whatCouldNotBeFound}${adminLog ? ' (server-side error)' : ''}`, adminLog ? 500 : 404, undefined, this.logged);
  }

  serverErr(whatFailed: string = 'An error occurred', adminLog?: string | boolean): ApiError {
    if (adminLog) {
      this.log(typeof adminLog == 'boolean' ? `This should not have happened: ${whatFailed}` : adminLog);
    }

    return new ApiError(`${whatFailed}`, 500, undefined, this.logged);
  }

  serviceUnavailable(description: string = 'Service Unavailable', adminLog?: string | boolean): ApiError {
    if (adminLog) {
      this.log(typeof adminLog == 'boolean' ? `This should not have happened: ${description}` : adminLog);
    }

    return new ApiError(`${description}`, 503, undefined, this.logged);
  }

  invalidParams(paramType: 'url' | 'query', params: { param: string, condition: string }[]): ApiError {
    return new ApiError(`Missing or invalid ${paramType} parameters`, 400, params, this.logged);
  }

  invalidBody(expected: { param: string, condition: string }[]): ApiError {
    return new ApiError(`Missing or invalid body`, 400, expected, this.logged);
  }
}

export class HttpError {
  static getName(httpCode: number): string | null {
    /* 100s */
    if (httpCode == 100) return 'Continue';
    if (httpCode == 101) return 'Switching Protocols';
    if (httpCode == 102) return 'Processing';

    /* 200s */
    if (httpCode == 200) return 'OK';
    if (httpCode == 201) return 'Created';
    if (httpCode == 202) return 'Accepted';
    if (httpCode == 203) return 'Non-Authoritative Information';
    if (httpCode == 204) return 'No Content';
    if (httpCode == 205) return 'Reset Content';
    if (httpCode == 206) return 'Partial Content';
    if (httpCode == 207) return 'Multi-Status';

    /* 300s */
    if (httpCode == 300) return 'Multiple Choices';
    if (httpCode == 301) return 'Moved Permanently';
    if (httpCode == 302) return 'Found (Moved Temporarily)';
    if (httpCode == 303) return 'See Other';
    if (httpCode == 304) return 'Not Modified';
    if (httpCode == 305) return 'Use Proxy';
    if (httpCode == 307) return 'Temporary Redirect';
    if (httpCode == 308) return 'Permanent Redirect';

    /* 400s */
    if (httpCode == 400) return 'Bad Request';
    if (httpCode == 401) return 'Unauthorized';
    if (httpCode == 402) return 'Payment Required';
    if (httpCode == 403) return 'Forbidden';
    if (httpCode == 404) return 'Not Found';
    if (httpCode == 405) return 'Method Not Allowed';
    if (httpCode == 406) return 'Not Acceptable';
    if (httpCode == 407) return 'Proxy Authentication Required';
    if (httpCode == 408) return 'Request Timeout';
    if (httpCode == 409) return 'Conflict';
    if (httpCode == 410) return 'Gone';
    if (httpCode == 411) return 'Length Required';
    if (httpCode == 412) return 'Precondition Failed';
    if (httpCode == 413) return 'Request Entity Too Large';
    if (httpCode == 414) return 'URI Too Long';
    if (httpCode == 415) return 'Unsupported Media Type';
    if (httpCode == 416) return 'Requested range not satisfiable';
    if (httpCode == 417) return 'Expectation Failed';
    if (httpCode == 420) return 'Policy Not Fulfilled';
    if (httpCode == 421) return 'Misdirected Request';
    if (httpCode == 422) return 'Unprocessable Entity';
    if (httpCode == 423) return 'Locked';
    if (httpCode == 424) return 'Failed Dependency';
    if (httpCode == 426) return 'Upgrade Required';
    if (httpCode == 428) return 'Precondition Required';
    if (httpCode == 429) return 'Too Many Requests';
    if (httpCode == 431) return 'Request Header Fields Too Large';
    if (httpCode == 451) return 'Unavailable For Legal Reasons';

    /* 500s */
    if (httpCode == 500) return 'Internal Server Error';
    if (httpCode == 501) return 'Not Implemented';
    if (httpCode == 502) return 'Bad Gateway';
    if (httpCode == 503) return 'Service Unavailable';
    if (httpCode == 504) return 'Gateway Timeout';
    if (httpCode == 505) return 'HTTP Version not supported';
    if (httpCode == 506) return 'Variant Also Negotiates';
    if (httpCode == 507) return 'Insufficient Storage';
    if (httpCode == 508) return 'Loop Detected';

    return null;
  }
}

/**
 * This shortcut function responses with HTTP 405 to the requests having
 * a method that does not have corresponding request handler.
 *
 * For example if a resource allows only GET and POST requests then
 * PUT, DELETE, etc. requests will be responsed with the 405.
 *
 * HTTP 405 is required to have Allow-header set to a list of allowed
 * methods so in this case the response has "Allow: GET, POST, HEAD" in its headers.
 *
 * Example usage
 *
 *    // A handler that allows only GET (and HEAD) requests and returns
 *    app.all('/path', (req, res, next) => {
 *      restful(req, res, {
 *        get: () => {
 *          res.send('Hello world!');
 *        }
 *      });
 *    });
 *
 * Orignal author: https://stackoverflow.com/a/15754373/9346616
 */
export function restful(req: Request, res: Response, handlers: { [key: string]: () => void }): void {
  const method = (req.method || '').toLowerCase();

  if (method in handlers) {
    handlers[method]();
  } else {
    const allowedMethods: string[] = Object.keys(handlers);
    if ('get' in handlers && !('head' in handlers)) {
      allowedMethods.push('head');
    }

    res.set('Allow', allowedMethods.join(', ').toUpperCase())
      .sendStatus(405); // TODO: send error-custom body
  }
}

export function setCaching(res: Response, cacheResource: boolean = true, publicResource: boolean = true, duration?: number, proxyDuration?: number | undefined): Response {
  let value = '';

  if (cacheResource) {
    value += publicResource ? 'public' : 'private';

    if (duration) {
      value += `, max-age=${duration}`;
    }

    if (proxyDuration) {
      value += `, s-maxage=${proxyDuration}`;
    } else if (typeof duration == 'number') {
      value += `, s-maxage=${duration}`;
    }
  } else {
    value = 'no-cache, no-store, must-revalidate';
  }

  return res.set('Cache-Control', value);
}

export function isUUID(str: string): boolean {
  if (typeof str !== 'string') return false;

  str = str.toLowerCase();

  return str.length >= 32 && str.length <= 36 && (UUID_PATTERN.test(str) || UUID_PATTERN.test(str.replace(/-/g, '').replace(UUID_PATTERN_ADD_DASH, '$1-$2-$3-$4-$5')));
}

export function addHyphensToUUID(str: string): string {
  return str.replace(/-/g, '').replace(UUID_PATTERN_ADD_DASH, '$1-$2-$3-$4-$5');
}

/**
 * Only looks for http(s) protocol
 */
export function isHttpURL(str: string): boolean {
  return /^(http|https):\/\/[^]+$/.test(str.toLowerCase());
}

export function getFileNameFromURL(str: string, stripFileExtension: boolean = false): string {
  const url = new URL(str);

  let fileName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);

  if (stripFileExtension) {
    const i = fileName.lastIndexOf('.');

    if (i != -1) {
      return fileName.substring(0, i);
    }
  }

  return fileName;
}

/**
 * Checks if string only contains numbers (negative numbers are not allowed)
 */
export function isNumber(str: string): boolean {
  if (typeof str == 'number') return !Number.isNaN(str) && Number.isFinite(str);
  if (typeof str != 'string') return false;

  return /^[0-9]+$/.test(str);
}

export function toBoolean(input: string | number | boolean): boolean {
  if (input) {
    if (typeof input == 'string') return input == '1' || input.toLowerCase() == 'true' || input.toLowerCase() == 't';
    if (typeof input == 'number') return input == 1;
    if (typeof input == 'boolean') return input;
  }

  return false;
}

export function toInt(input: string | number | boolean): number | null {
  if (input) {
    if (typeof input == 'number') return input;
    if (typeof input == 'string' && isNumber(input)) return parseInt(input);
  }

  return null;
}