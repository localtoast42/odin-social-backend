import { Schema, Types, model } from "mongoose";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import bcrypt from "bcrypt";
import config from "config";

export interface UserBase {
  username: string;
  firstName: string;
  lastName: string;
  city?: string;
  state?: string;
  country?: string;
  imageUrl?: string;
  isGuest?: boolean;
}

export interface UserCreate extends UserBase {
  password: string;
}

export interface User extends UserCreate {
  _id: Types.ObjectId;
  id: string;
  isAdmin: boolean;
  isGuest: boolean;
  followers: Array<Types.ObjectId | string>;
  following: Array<Types.ObjectId | string>;
  followedByMe?: boolean;
  hasFollows?: boolean;
  fullName?: string;
  url?: string;
  comparePassword(candidatePassword: string): Promise<Boolean>;
}

const opts = {
  toJSON: {
    virtuals: true,
    flattenObjectIds: true,
  },
};

const userSchema = new Schema<User>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minLength: 3,
      maxLength: 100,
    },
    password: { type: String, required: true },
    imageUrl: { type: String },
    firstName: { type: String, required: true, maxLength: 100 },
    lastName: { type: String, required: true, maxLength: 100 },
    city: { type: String, maxLength: 200 },
    state: { type: String, maxLength: 200 },
    country: { type: String, maxLength: 200 },
    isAdmin: { type: Boolean, required: true, default: false },
    isGuest: { type: Boolean, required: true, default: true },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  opts
);

userSchema.pre("save", async function (next) {
  let user = this;

  if (!user.isModified("password")) {
    return next();
  }

  const hashedPassword = bcrypt.hashSync(
    user.password,
    config.get<number>("saltWorkFactor")
  );

  user.password = hashedPassword;

  return next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  let user = this;

  return bcrypt.compare(candidatePassword, user.password).catch((e) => false);
};

userSchema.virtual("fullName").get(function () {
  let fullName = "";
  if (this.firstName && this.lastName) {
    fullName = `${this.firstName} ${this.lastName}`;
  }

  return fullName;
});

userSchema.virtual("url").get(function () {
  return `/users/${this._id}`;
});

userSchema.virtual("hasFollows").get(function () {
  return (this.following?.length ?? 0) !== 0;
});

userSchema.virtual("followedByMe").get(function () {
  return false;
});

userSchema.plugin(mongooseLeanVirtuals);

const UserModel = model<User>("User", userSchema);

export default UserModel;
