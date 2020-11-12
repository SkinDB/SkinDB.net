import { Router } from 'express';
import { restful, ErrorBuilder, isNumber } from '../utils';
import { PageParts, render, global } from '../dynamicPageGenerator';
import { getAccount, getSkin, getSearch, getTopThisWeek, getSkins, setTagVote, getSearchForFile } from '../apiUtils';
import { cfg } from '..';
import request from 'request';
import { post as httpPost } from 'superagent';

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

router.all('/skin/:skinID/vote', (req, res, next) => {
  if (!req.params.skinID) return next(new ErrorBuilder().notFound());
  if (!isNumber(req.params.skinID)) return next(new ErrorBuilder().notFound());

  restful(req, res, {
    post: () => {
      if (!req.session || !req.session.data) return res.status(401).send('You are not logged in');

      let tag = ((req.body.tag || '') as string).trim(),
        vote: string | boolean = ((req.body.vote || '') as string).trim().toLowerCase();

      if (tag.length == 0 || tag.includes('\n') || tag.includes('\r')) return next(new ErrorBuilder().invalidBody([{ param: 'tag', condition: 'Valid one-line string' }]));
      if (vote != 'on' && vote != 'off' && vote != 'unset') return next(new ErrorBuilder().invalidBody([{ param: 'vote', condition: `'on', 'off' or 'unset'` }]));

      if (vote != 'unset') {
        vote = vote == 'on';
      }

      setTagVote(req.session.data.id, req.params.skinID, tag, vote)
        .then(() => {
          return res.redirect(303, `/skin/${req.params.skinID}`);
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
      getSkin(req.params.skinID, req.session?.data ? req.session.data.id : null)
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
    },
    post: () => {
      if (req.header('Content-Type')?.toLowerCase() != 'image/png') return next(new ErrorBuilder().invalidBody([{ param: 'body', condition: 'Valid PNG' }]));

      getSearchForFile(req.body, 1)
        .then((searchRes) => {
          res.type('html')
            .send(render(PageParts.SEARCH, req, { search: searchRes }));
        }).catch(next);
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

        httpPost('https://Mc-Auth.com/oAuth2/token')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          // .set('User-Agent', '') // TODO
          .send({
            // client_secret from Mc-Auth to authenticate our request
            client_id: cfg.mcAuth.clientID,
            client_secret: cfg.mcAuth.clientSecret,

            code: req.query.code,             // The code that Mc-Auth told the user to give us (redirect)
            redirect_uri: `${global.url.base}/login${req.query.returnTo ? `?returnTo=${req.query.returnTo}` : ''}`,        // The same URL we redirected the user to
            grant_type: 'authorization_code'  // REQUIRED. See oAuth2 specs
          })
          .end((err, httpBody) => {
            console.log(httpBody.body);
            if (err) return next(err);  // An error occurred
            if (!httpBody.body.access_token || !req.session) return next(new Error('ApiError.create(ApiErrs.INTERNAL_SERVER_ERROR)')); // Should not be possible but just in case

            // Authentication was successful!!

            // TODO: Update mc inside session periodically
            // TODO: Render mc-skin or logged in user (header) by URL instead of UUID
            req.session.data = { id: httpBody.body.data.profile.id, mc: httpBody.body.data.profile };


            // Successful
            req.session.save((err) => {
              if (err) return next(err);

              const returnTo = (req.query.returnTo as string || '').toLowerCase();

              return res.redirect(returnTo.startsWith(global.url.base) ? req.query.returnTo as string : global.url.base);
            });
          });
      } else {
        const authReqURL =
          'https://Mc-Auth.com/oAuth2/authorize' +
          '?client_id=' + // Your client_id from https://mc-auth.com/de/settings/apps
          cfg.mcAuth.clientID +
          '&redirect_uri=' + // Where should Mc-Auth.com redirect the client to (needs to be whitelisted inside your app settings)
          encodeURIComponent(`${global.url.base}/login${req.query.returnTo ? `?returnTo=${req.query.returnTo}` : ''}`) +
          '&scope=profile' + // Optional. Tells Mc-Auth that we want the public profile (so we don't have to contact Mojang ourself)
          '&response_type=code'; // 'token' is supported too

        // Redirect client to Mc-Auth.com
        return res.redirect(authReqURL);
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