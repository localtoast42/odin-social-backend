import Post from '../models/post';
import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';

function isPostAuthor(req, res, next) {
  Post.findOne({ _id: req.params.postId })
    .then((post) => {
      if (post.author.toString() === req.user.id) {
        return next();
      } else {
        return res.status(401).json({ success: false, msg: "Unauthorized" });
      }
    })
    .catch((err) => next(err));
};

exports.post_create = [
  body("title")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Title must be provided."),
  body("text")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Post must not be empty."),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const post = new Post({
      title: req.body.title,
      author: req.user.id,
      text: req.body.text,
      postDate: Date.now()
    });

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      const newPost = await post.save();
      res.status(201).json(newPost);
    };
  }),
];

exports.post_update = [
  isPostAuthor,

  body("title")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Title must be provided."),
  body("text")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Post must not be empty."),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const post = await Post.findOne({ _id: req.params.postId });

    post.title = req.body.title;
    post.text = req.body.text;
    post.lastEditDate = Date.now();

    if (!errors.isEmpty()) {
      res.status(400).json(errors);
    } else {
      const updatedPost = await Post.findByIdAndUpdate(post._id, post, {});
      res.status(200).json(updatedPost);
    };
  }),
];

exports.post_delete = [
  isPostAuthor,

  asyncHandler(async (req, res, next) => {    
      await Comment.deleteMany({ post: req.params.postId });
      await Post.findByIdAndDelete(req.params.postId);
      res.status(200).end();
  }),
]

exports.post_modify_likes = asyncHandler(async (req, res, next) => {
  const post = await Post.findOne({ _id: req.params.postId });

  if (post.likes.includes(req.user.id)) {
    post.likes = post.likes.filter((userid) => userid != req.user.id);
  } else {
    post.likes.push(req.user.id);
  }

  const updatedPost = await post.save();
  res.status(200).json(updatedPost);
});