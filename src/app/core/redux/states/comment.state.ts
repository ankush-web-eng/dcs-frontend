import {Action, Selector, State, StateContext} from '@ngxs/store';
import {catchError, tap} from 'rxjs/operators';

import {CommentService} from '../services';
import {CommentStateModel, initCommentStateModel} from './comment-state.model';
import {CommentErrorAction, CreateCommentAction, FetchCaptchaAction, FetchCommentsAction} from '../actions';
import {Captcha, Comment, CommentError} from '../models';
import {of} from 'rxjs';

@State<CommentStateModel>({
  name: 'comment',
  defaults: initCommentStateModel()
})
export class CommentState {

  @Selector()
  static captcha(state: CommentStateModel): Captcha {
    return state.captcha;
  }

  @Selector()
  static comments(state: CommentStateModel): Comment[] {
    return state.comments;
  }

  @Selector()
  static commentsCount(state: CommentStateModel): number {
    return state && state.comments && state.comments.length || 0;
  }

  @Selector()
  static error(state: CommentStateModel): CommentError {
    return state.error;
  }

  constructor(private commentService: CommentService) {
  }

  @Action(FetchCaptchaAction)
  fetchCaptchaAction(ctx: StateContext<CommentStateModel>) {
    return this.commentService.fetchCaptcha().pipe(tap(captcha => {
      ctx.patchState({captcha});
    }));
  }

  @Action(CreateCommentAction)
  createCommentAction(ctx: StateContext<CommentStateModel>, action: CreateCommentAction) {
    return this.commentService.createComment(action.comment, action.captcha).pipe(
      catchError((error: Error) => {
        console.log(error);
        if (error.message === 'GraphQL error: invalid-captcha') {
          console.log(error.message);
          ctx.dispatch(new CommentErrorAction('Invalid captcha'));
        }
        return of();
      })
    );
  }

  @Action(CommentErrorAction)
  commentErrorAction(ctx: StateContext<CommentStateModel>, action: CommentErrorAction) {
    ctx.patchState({error: {message: action.errorMessage, timestamp: new Date().getTime()}});
  }

  @Action(FetchCommentsAction)
  fetchCommentsAction(ctx: StateContext<CommentStateModel>, action: FetchCommentsAction) {
    return this.commentService.fetchComments(action.postId).pipe(tap(comments => ctx.patchState({comments})));
  }
}
