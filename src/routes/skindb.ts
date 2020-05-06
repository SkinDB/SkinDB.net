import { Router } from 'express';
import { restful, ErrorBuilder, isNumber } from '../utils';
import { PageParts, render } from '../dynamicPageGenerator';
import { getAccount, getSkin, getSearch } from '../apiUtils';

/* Routes */
const router = Router();
export const skindbExpressRouter = router;

router.all(['/', '/index.html'], (req, res, next) => {
  restful(req, res, {
    get: () => {
      res.type('html')
        .send(render(PageParts.INDEX));
    }
  });
});

router.all('/account/:uuid?', (req, res, next) => {
  if (!req.params.uuid) return next(new ErrorBuilder().notFound());

  restful(req, res, {
    get: () => {
      getAccount(req.params.uuid)
        .then((account) => {
          const result = render(PageParts.ACCOUNT, { page: { account } });

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
          const result = render(PageParts.SKIN, { page: { skin } });

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
        .send(render(PageParts.CAPE));
    }
  });
});

router.all(['/history', '/history.html'], (req, res, next) => {
  restful(req, res, {
    get: () => {
      res.type('html')
        .send(render(PageParts.HISTORY));
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
            .send(render(PageParts.SEARCH, { page: { search: searchRes } }));
        })
        .catch(next);
    }
  });
});