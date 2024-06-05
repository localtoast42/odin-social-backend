import User from '../models/user.js';
import Post from '../models/post.js';
import bcrypt from 'bcryptjs'
import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';

function isUserCreator(req, res, next) {
  User.findOne({ _id: req.params.userId })
    .then((user) => {
      if (user.id === req.user.id) {
        return next();
      } else {
        return res.status(401).json({ success: false, msg: "Unauthorized" });
      }
    })
    .catch((err) => next(err));
};

export const user_list_get = asyncHandler(async (req, res, next) => {
  const allUsers = await User.find()
    .sort("-lastName")
    .exec();

  const allUsersData = allUsers.map(user => {
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      url: user.url,
    }
  })

  res.status(200).json(allUsersData);
});

export const user_self_get = asyncHandler(async (req, res, next) => {
  const user = {
    id: req.user.id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    username: req.user.username,
    isAuthor: req.user.isAuthor
  }

  res.json(user);
});

export const self_following_get = asyncHandler(async (req, res, next) => {
  res.status(200).json(req.user.following);
});

export const user_create = [
  body("username")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Username must be provided.")
    .isAlphanumeric()
    .withMessage("Username has non-alphanumeric characters."),
  body("password")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Password must be provided."),
  body("confirm_password")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Password must be provided.")
    .custom((value, { req }) => {
        return value === req.body.password;
    })
    .withMessage("Passwords must match."),
  body("firstName")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("First name must be provided.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("lastName")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Last name must be provided.")
    .isAlphanumeric()
    .withMessage("Last name has non-alphanumeric characters."),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const user = new User({
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    });

    if (!errors.isEmpty()) {
      res.send(errors.mapped());
    } else {
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) {
          return next(err);
        }
        user.password = hashedPassword;
        const result = await user.save();
        res.status(201).end();
      });
    };
  }),
];

export const user_update = [
  isUserCreator,

  body("firstName")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("First name must be provided.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("lastName")
    .trim()
    .isLength( { min: 1 })
    .escape()
    .withMessage("Last name must be provided.")
    .isAlphanumeric()
    .withMessage("Last name has non-alphanumeric characters."),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    });

    if (!errors.isEmpty()) {
      res.send(errors.array());
    } else {
      const updatedUser = await User.findByIdAndUpdate(req.params.userId, user, {});
      res.status(200).end();
    }
  }),
];

export const user_delete = [
  isUserCreator,

  asyncHandler(async (req, res, next) => {
    await User.findByIdAndDelete(req.params.userId);
    res.status(200).end();
  }),
];

export const get_posts_by_user = asyncHandler(async (req, res, next) => {
  const postsByUser = await Post.find({ author: req.user })
    .populate("author")
    .sort("-postDate")
    .exec();

  const postsByUserData = postsByUser.map(post => {
    return {
      id: post.id,
      text: post.text,
      date: post.postDateFormatted,
      lastEditDate: post.lastEditDateFormatted,
      author: post.author.fullName
    }
  })

  res.status(200).json(postsByUserData);
});

export const user_following_get = asyncHandler(async (req, res, next) => {
  const following = await User.findOne({ _id: req.params.userId }, "following");
  res.status(200).json(following);
});

export const user_follow = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const target = await User.findOne({ _id: req.params.userId });

  if (!user.following.includes(target._id)) {
    user.following.push(target._id);
    await User.findByIdAndUpdate(user.id, user, {});
  }

  if (!target.followers.includes(user.id)) {
    target.followers.push(user.id);
    await User.findByIdAndUpdate(req.params.targetId, target, {});
  }

  res.status(200).end();
});

export const user_unfollow = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const target = await User.findOne({ _id: req.params.userId });

    user.following = user.following.filter((userid) => userid.toString() !== target._id.toString());
    target.followers = target.followers.filter((userid) => userid.toString() != user.id.toString());

    await User.findByIdAndUpdate(user.id, user, {});
    await User.findByIdAndUpdate(req.params.targetId, target, {});
    
    res.status(200).end();
});