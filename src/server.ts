import express = require('express');
import expressSess = require('express-session');
import expressSessPsql = require('connect-pg-simple');
import morgan = require('morgan');
import path = require('path');

import { skindbExpressRouter } from './routes/skindb';
import { statusExpressRouter } from './routes/status';

import { cfg, db, webAccessLogStream } from '.';
import { ErrorBuilder, ApiError, HttpError } from './utils';
import { Pool } from 'pg';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', cfg.trustProxy);

/* Logging webserver request */
app.use(morgan(cfg.logging.accessLogFormat, { stream: webAccessLogStream }));
if (process.env.NODE_ENV == 'production') {
  app.use(morgan('dev', { skip: (_req, res) => res.statusCode < 500 }));
} else {
  app.use(morgan('dev'));
}

// Force the last query param instead of allowing multiple as string[]
app.use((req, _res, next) => {
  for (const key in req.query) {
    if (req.query.hasOwnProperty(key)) {
      const value = req.query[key];

      if (Array.isArray(value)) {
        let newValue = value.pop();

        if (typeof newValue != 'undefined') {
          req.query[key] = newValue;
        } else {
          delete req.query[key];
        }
      }
    }
  }

  next();
});

app.use(expressSess({
  name: 'sessID',
  store: db.isAvailable() ? new (expressSessPsql(expressSess))({
    pool: db.getPool() as Pool,
    tableName: 'sessions',
    pruneSessionInterval: 60 * 60 * 24 /*24h*/
  }) : undefined,
  secret: cfg.sessionSecret,
  resave: false,
  unset: 'destroy',
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 /*30d*/ }
}));

// Default response headers
app.use((_req, res, next) => {
  res.set({
    // 'Access-Control-Allow-Origin': '*',
    // 'Access-Control-Allow-Headers': 'User-Agent,Authorization,If-None-Match,Content-Type,If-Unmodified-Since',

    // 'Cache-Control': 'public, s-maxage=30, max-age=30'
  });

  next();
});

/* Prepare Request */
app.use(express.urlencoded({ extended: false }));
// app.use(express.raw({ type: ['image/png'], limit: '3MB' }));  // recode to send custom error messages
// app.use(express.json());

/* Webserver routes */
app.use('/status', statusExpressRouter);
app.use('/', skindbExpressRouter);

// Optional: Serving static files too
if (cfg.web.serveStatic) {
  app.use(express.static(path.join(__dirname, '..', 'resources', 'web', 'static')));
}

/* Error handling */
app.use((_req, _res, next) => {
  next(new ErrorBuilder().notFound());
});

app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!err) {
    err = new ErrorBuilder().log('Called the error handler without an Error!').unknown();
  }

  if (!(err instanceof Error)) {
    err = new ErrorBuilder().log('Error handler got unknown err-object', err).unknown();
  } else if (err instanceof Error && !(err instanceof ApiError)) {
    err = ApiError.fromError(err);
  }

  if (err.httpCode >= 500 && err.httpCode != 503 && !err.logged) {
    ApiError.log(err);
  }

  if (res.headersSent) return next(err);  // Calls express default handler

  res.status(err.httpCode)
    .send({
      error: HttpError.getName(err.httpCode) || err.httpCode,
      message: err.message,
      details: err.details
    });
});