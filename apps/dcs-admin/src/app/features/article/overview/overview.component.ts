import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';

import {Store} from '@ngxs/store';

import {
  AuthState, FetchTagsAction,
  File, Permissions,
  Post,
  PostCreateAction,
  PostState,
  PostUpdateAction, Tag, TagState,
  UrlUtilsService
} from '@dcs-libs/shared';
import {SelectImageModalComponent} from './select-image-modal/select-image-modal.component';
import {BehaviorSubject} from 'rxjs';
import {map,} from 'rxjs/operators';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent extends Permissions implements OnInit {
  post = {
    body: ''
  } as Post;

  formDataChange = false;
  imageChange = false;

  timesSelections = [];

  articleForm = new FormGroup({
    body: new FormControl(''),
    enable: new FormControl(''),
    description: new FormControl(''),
    title: new FormControl(''),
    tags: new FormControl([]),
    publishedAt: new FormControl(),
    time: new FormControl()
  });

  tags = new BehaviorSubject([]);

  constructor(
    private store: Store,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private url: UrlUtilsService
  ) {
    super();
    this.timesSelections = [...Array(24).keys()].reduce((p, v) => {
      p.push({minutes: v * 60, title: `${v}:00`});
      p.push({minutes: v * 60 + 30, title: `${v}:30`});
      return p;
    }, []);
  }

  ngOnInit() {
    if (!this.isNewPost()) {
      this.store.select(PostState.post).subscribe(post => {
        if (post) {
          const newPost = {...post};
          if (newPost.banner) {
            newPost.banner = {...newPost.banner};
            newPost.banner.url = this.url.normalizeImageUrl(newPost.banner.url);
          }
          this.post = newPost;
          this.articleForm.controls.body.setValue(this.post.body);
          this.articleForm.controls.description.setValue(this.post.description);
          this.articleForm.controls.title.setValue(this.post.title);
          this.articleForm.controls.enable.setValue(Boolean(this.post.enable));
          this.articleForm.controls.tags.setValue(this.post.tags.map(tag => ({display: tag.name, value: tag.id})));
        }
      });
    }
    this.store.dispatch(new FetchTagsAction());
    this.store.select(TagState.tags)
      .pipe(map(tags => tags.map(tag => ({display: tag.name, value: tag.id}))))
      .subscribe(values => this.tags.next(values));
    this.getTags = this.getTags.bind(this);
  }

  getTags() {
    return this.tags;
  }

  normalizeUrl(url) {
    return this.url.normalizeImageUrl(url);
  }

  isNewPost() {
    return !this.activatedRoute.snapshot.params.id;
  }

  onPostChange() {
    const keyNames = ['body', 'description', 'title', 'enable'];
    this.formDataChange = keyNames.reduce((prev, key) => {
      return (
        prev ||
        (this.post && this.post[key] !== this.articleForm.controls[key].value)
      );
    }, false);
    this.formDataChange = this.formDataChange || this.tagChange();
  }

  tagChange() {
    const tset = new Set();
    if (this.post.tags.length !== this.articleForm.controls.tags.value.length) {
      return true;
    }
    this.post.tags.forEach(tag => tset.add(tag.id));
    return this.articleForm.controls.tags.value.reduce((p, v) => p || !tset.has(v.value), false);
  }

  submitPost() {
    this.post.body = this.articleForm.controls.body.value;
    this.post.description = this.articleForm.controls.description.value;
    this.post.title = this.articleForm.controls.title.value;
    this.post.enable = !!this.articleForm.controls.enable.value;
    this.post.tags = this.articleForm.controls.tags.value.map(tag => ({name: tag.display, id: tag.value} as Tag));

    if (this.isNewPost()) {
      this.store
        .dispatch(
          new PostCreateAction(
            this.post,
            this.store.selectSnapshot(AuthState.me)
          )
        )
        .subscribe(() => {
          this.router.navigate([
            `/articles/update/${this.store.selectSnapshot(PostState.newPostId)}`
          ]);
        });
    } else {
      this.store.dispatch(new PostUpdateAction(this.post)).subscribe(() => {
        this.imageChange = this.formDataChange = false;
      });
    }
  }

  openImageSectorModal() {
    const dialog = this.dialog.open(SelectImageModalComponent, {
      height: 'auto',
      width: '50vw'
    });

    dialog.afterClosed().subscribe((image: File) => {
      if (image) {
        this.post.banner = image;
        this.imageChange = true;
      }
    });
  }
}
