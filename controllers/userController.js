import User from '../models/user.js';
import Post from '../models/post.js';
import bcrypt from 'bcryptjs'
import asyncHandler from 'express-async-handler';
import { faker } from '@faker-js/faker';
import { body, validationResult } from 'express-validator';
import { createRandomUser, createRandomPost } from '../scripts/populatedb.js';

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
  User.find()
    .where("_id").ne(req.user.id)
    .where("isGuest").ne(true)
    .sort("lastName")
    .exec()
    .then((allUsers) => {
      const allUsersData = allUsers.map(user => {
        return {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          imageUrl: user.imageUrl,
          url: user.url,
        }
      })
      return res.status(200).json(allUsersData);
    })
    .catch((err) => next(err));
});

export const user_get = asyncHandler(async (req, res, next) => {
  User.findOne({ _id: req.params.userId })
    .then((user) => {
      const userData = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        imageUrl: user.imageUrl,
        url: user.url,
        followedByMe: req.user.following.includes(user.id),
      }

      return res.status(200).json(userData);
    })
    .catch((err) => next(err));
});

export const user_self_get = asyncHandler(async (req, res, next) => {
  const user = {
    id: req.user.id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    fullName: req.user.fullName,
    username: req.user.username,
    imageUrl: req.user.imageUrl,
    isAdmin: req.user.isAdmin,
    url: req.user.url,
    hasFollows: req.user.following.length !== 0,
  }

  res.status(200).json(user);
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
        
        user.save()
          .then((result) => {
            return res.status(201).end();
          })
          .catch((err) => next(err));
      });
    };
  }),
];

export const guest_create = asyncHandler(async (req, res, next) => {
  const guestNum = faker.string.alphanumeric(8);

  const user = new User({
    username: `Guest_#${guestNum}`,
    firstName: "Guest",
    lastName: `#${guestNum}`,
    isGuest: true,
  });

  bcrypt.hash("guest", 10, async (err, hashedPassword) => {
    if (err) {
      return next(err);
    }
    user.password = hashedPassword;

    user.save()
      .then((result) => {
        req.body.username = result.username;
        req.body.password = "guest";
        next();
      })
      .catch((err) => next(err));
  });
});

export const populate_users = asyncHandler(async (req, res, next) => {
  const userCount = req.body.userCount;
  const postCount = req.body.postCount;

  for (let i = 0; i < userCount; i++) {
    let user = createRandomUser();

    bcrypt.hash(user.password, 10, async (err, hashedPassword) => {
      if (err) {
        return next(err);
      }
      user.password = hashedPassword;

      let newUser = await user.save();

      for (let j = 0; j < postCount; j++) {
        let post = createRandomPost(newUser);
        let newPost = await post.save();
      }
    });
  }

  res.status(201).end();
});

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
      User.findByIdAndUpdate(req.params.userId, user, {})
        .then((updatedUser) => {
          return res.status(200).end();
        })
        .catch((err) => next(err));
    }
  }),
];

export const user_delete = [
  isUserCreator,

  asyncHandler(async (req, res, next) => {
    User.findByIdAndDelete(req.params.userId)
      .then((result) => {
        return res.status(200).end();
      })
      .catch((err) => next(err));
  }),
];

export const get_posts_by_user = asyncHandler(async (req, res, next) => {
  Post.find({ author: req.params.userId })
    .populate("author")
    .sort("-postDate")
    .exec()
    .then((postsByUser) => {
      const postsByUserData = postsByUser.map(post => {
        return {
          id: post.id,
          url: post.url,
          text: post.text,
          dateTime: post.postDate,
          date: post.postDateFormatted,
          lastEditDate: post.lastEditDateFormatted,
          author: {
            id: post.author.id,
            username: post.author.username,
            fullName: post.author.fullName,
            imageUrl: post.author.imageUrl,
            url: post.author.url
          },
          numLikes: post.likes.length,
          isLiked: post.likes.includes(req.user.id),
          numComments: post.comments.length
        }
      });
      return res.status(200).json(postsByUserData);
    })
    .catch((err) => next(err));
});

export const user_following_get = asyncHandler(async (req, res, next) => {
  User.findOne({ _id: req.params.userId }, "following")
    .then((following) => {
      return res.status(200).json(following);
    })
    .catch((err) => next(err));
});

export const user_follow = asyncHandler(async (req, res, next) => {
  const user = req.user;
  
  User.findOne({ _id: req.params.userId })
    .then((target) => {
      const promises = [];

      if (!user.following.includes(target._id)) {
        user.following.push(target._id);
        promises.push(User.findByIdAndUpdate(user.id, user, {}));
      }
    
      if (!target.followers.includes(user.id)) {
        target.followers.push(user.id);
        promises.push(User.findByIdAndUpdate(req.params.targetId, target, {}));
      }

      return Promise.all(promises);
    })
    .then((responses) => {
      return res.status(200).end();
    })
    .catch((err) => next(err));
});

export const user_unfollow = asyncHandler(async (req, res, next) => {
    const user = req.user;
    
    User.findOne({ _id: req.params.userId })
      .then((target) => {
        user.following = user.following.filter((userid) => userid.toString() !== target._id.toString());
        target.followers = target.followers.filter((userid) => userid.toString() != user.id.toString());

        const promises = [];
        promises.push(User.findByIdAndUpdate(user.id, user, {}));
        promises.push(User.findByIdAndUpdate(req.params.targetId, target, {}));

        return Promise.all(promises);
      })
      .then((responses) => {
        return res.status(200).end();
      })
      .catch((err) => next(err));
});