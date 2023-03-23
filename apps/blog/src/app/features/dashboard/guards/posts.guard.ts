import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { CanActivate, UrlTree } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

import { Observable, of } from 'rxjs';
import { Store } from '@ngxs/store';
import { map, mergeMap } from 'rxjs/operators';

import {
  FetchPodcastAction,
  FetchPostsAction,
  FetchTopActiveUsersAction, FetchTopPopularUsersAction,
  RecentCommentAction,
  SetFiltersAction,
  Where
} from '@dcs-libs/shared';

@Injectable()
export class PostsGuard implements CanActivate {
  isBrowser = false;

  constructor(private store: Store, @Inject(PLATFORM_ID) platformId: string) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    let res: Observable<boolean | UrlTree> = of(true);
    if (this.isBrowser) {
      res = this.store.dispatch(new SetFiltersAction({ enable: true } as Where)).pipe(
        mergeMap(() => this.store.dispatch(new FetchPostsAction())),
        mergeMap(() => this.store.dispatch(new RecentCommentAction())),
        mergeMap(() => this.store.dispatch(new FetchTopActiveUsersAction())),
        mergeMap(() => this.store.dispatch(new FetchTopPopularUsersAction())),
        mergeMap(() => this.store.dispatch(new FetchPodcastAction())),
        map(() => true)
      );
    }
    return res;
  }
}
