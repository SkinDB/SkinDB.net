import { Router } from 'express';
import { restful, ErrorBuilder, isNumber } from '../utils';
import { PageParts, render, global } from '../dynamicPageGenerator';
import { getAccount, getSkin, getSearch, getTopThisWeek, getSkins } from '../apiUtils';
import { cfg } from '..';
import request from 'request';

/* Routes */
const router = Router();
export const skindbExpressRouter = router;

router.all('/', (req, res, next) => {
  restful(req, res, {
    get: () => {
      getTopThisWeek()
        .then((index) => {
          const result = render(PageParts.INDEX, req, { index });

          res.type('html')
            .send(result);
        })
        .catch(next);
    }
  });
});

router.all('/account/:uuid?', (req, res, next) => {
  if (!req.params.uuid) return next(new ErrorBuilder().notFound());

  restful(req, res, {
    get: () => {
      getAccount(req.params.uuid)
        .then((account) => {
          const result = render(PageParts.ACCOUNT, req, { account });

          res.type('html')
            .send(result);
        })
        .catch(next);
    }
  });
});

router.all('/skin/:skinID?', (req, res, next) => {
  if (!req.params.skinID) return next(new ErrorBuilder().notFound());
  if (!isNumber(req.params.skinID)) return next(new ErrorBuilder().notFound());

  restful(req, res, {
    get: () => {
      getSkin(req.params.skinID)
        .then((skin) => {
          const result = render(PageParts.SKIN, req, { skin });

          res.type('html')
            .send(result);
        })
        .catch(next);
    }
  });
});

router.all('/skins', (req, res, next) => {
  const page = (req.query.page as string) || 1;

  restful(req, res, {
    get: () => {
      getSkins(page)
        .then((skins) => {
          const result = render(PageParts.SKINS, req, { skins });

          res.type('html')
            .send(result);
        })
        .catch(next);
    }
  });
});

router.all(['/cape', '/cape.html'], (req, res, next) => {
  restful(req, res, {
    get: () => {
      res.type('html')
        .send(render(PageParts.CAPE, req));
    }
  });
});

router.all(['/history', '/history.html'], (req, res, next) => {
  restful(req, res, {
    get: () => {
      res.type('html')
        .send(render(PageParts.HISTORY, req));
    }
  });
});

router.all('/search', (req, res, next) => {
  restful(req, res, {
    get: () => {
      if (!req.query.q) return next(new ErrorBuilder().invalidParams('query', [{ param: 'q', condition: 'Valid string' }]));

      const page = (req.query.page as string) || 1;

      getSearch(req.query.q as string, page)
        .then((searchRes) => {
          res.type('html')
            .send(render(PageParts.SEARCH, req, { search: searchRes }));
        })
        .catch(next);
    }
  });
});

router.all('/login', (req, res, next) => {
  restful(req, res, {
    get: () => {
      // Already logged in
      if (req.session && req.session.data) {
        const returnTo = (req.query.returnTo as string || '').toLowerCase();

        return res.redirect(returnTo.startsWith(global.url.base) ? returnTo : global.url.base);
      }

      // Returning from Mc-Auth.com
      if (req.query.code || req.query.error) {
        if (req.query.error) {
          return res.send(`Login failed!\nerror: ${req.query.error}\nerror-description: ${req.query.error_description}`); //TODO
        }

        request('https://mc-auth.com/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: req.query.code,
            client_id: cfg.mcAuth.clientID,
            client_secret: cfg.mcAuth.clientSecret,
            redirect_uri: `${global.url.base}/login${req.query.returnTo ? `?returnTo=${req.query.returnTo}` : ''}`,
            grant_type: 'authorization_code'
          })
        }, (err, httpRes, body) => {
          if (err) return next(err);

          body = JSON.parse(body);

          if (httpRes.statusCode == 200 && body.data && body.data.profile) {
            if (!req.session) return res.send('Login failed!'); // TODO

            // TODO: Update mc inside session periodically
            // TODO: Render mc-skin or logged in user (header) by URL instead of UUID
            req.session.data = { id: body.data.profile.id, mc: body.data.profile };


            // Successful
            req.session.save((err) => {
              if (err) return res.send('Login failed!');  // TODO

              const returnTo = (req.query.returnTo as string || '').toLowerCase();

              return res.redirect(returnTo.startsWith(global.url.base) ? req.query.returnTo as string : global.url.base);
            });
          } else {
            // TODO: Show HTML
            return res.send('Login failed!');
          }
        });
      } else {
        // Redirect client to Mc-Auth.com
        return res.redirect(`https://mc-auth.com/oauth2/authorize?response_type=code&client_id=${cfg.mcAuth.clientID}&scope=profile&redirect_uri=${encodeURIComponent(`${global.url.base}/login${req.query.returnTo ? `?returnTo=${req.query.returnTo}` : ''}`)}`);
      }
    }
  });
});

router.all('/logout', (req, res, next) => {
  restful(req, res, {
    get: () => {
      const returnTo = (req.query.returnTo as string || '').toLowerCase();

      if (req.session) {
        req.session.data = null;

        req.session.destroy((err) => {
          if (err) return res.send('Logout failed!'); // TODO

          return res.redirect(returnTo.startsWith(global.url.base) ? returnTo : global.url.base);
        });
      } else {
        return res.redirect(returnTo.startsWith(global.url.base) ? returnTo : global.url.base);
      }
    }
  });
});