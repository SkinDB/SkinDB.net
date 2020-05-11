import { Router } from 'express';
import { restful, ErrorBuilder, isNumber } from '../utils';
import { PageParts, render, global } from '../dynamicPageGenerator';
import { getAccount, getSkin, getSearch, getTopThisWeek } from '../apiUtils';
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

      getSearch(req.query.q as string)
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
      if ((req.session as any).mcID) return res.send('Already Loggin as ' + (req.session as any).mcID);

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
            redirect_uri: `${global.url.base}/login`,
            grant_type: 'authorization_code'
          })
        }, (err, httpRes, body) => {
          if (err) return next(err);

          body = JSON.parse(body);

          if (httpRes.statusCode == 200 && body.data && body.data.profile) {
            // res.cookie('mcProfile', body['data']['profile'], { httpOnly: true, secure: secureCookies });

            // TODO: Update mc inside session periodically
            (req.session as any).data = { id: body.data.profile.id, mc: body.data.profile };
            // TODO
            return res.send(`success!\n${JSON.stringify(body.data.profile, null, 4)}`);
          }

          // TODO
          return res.send('Failure');
        });
      } else {
        return res.redirect(`https://mc-auth.com/oauth2/authorize?response_type=code&client_id=${cfg.mcAuth.clientID}&scope=profile&redirect_uri=${global.url.base}/login`);
      }
    }
  });
});