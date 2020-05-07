import { Router } from 'express';
import { restful, ErrorBuilder, isNumber } from '../utils';
import { PageParts, render } from '../dynamicPageGenerator';
import { getAccount, getSkin, getSearch, getTopThisWeek } from '../apiUtils';

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