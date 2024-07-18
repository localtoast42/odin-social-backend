import { FilterQuery, ProjectionType, QueryOptions, UpdateQuery } from "mongoose";
import { omit } from 'lodash-es';
import UserModel, { User, UserCreate } from "../models/user.model.js";

export async function createUser(input: UserCreate) {
  try {
    const user = await UserModel.create(input);
    return omit(user.toJSON(), "password");
  } catch (e: any) {
    throw new Error(e);
  }
}

export async function validatePassword({
  username, password
}: {
  username: string, 
  password: string
}) {
  const user = await UserModel.findOne({username});

  if (!user) {
    return false;
  }

  const isValid = await user.comparePassword(password);

  if (!isValid) return false;

  return omit(user.toJSON(), "password");
}

export async function findUser(
  query: FilterQuery<User>,
  projection?: ProjectionType<User>
) {
  return UserModel.findOne(query, projection ?? '').lean({ virtuals: true });
}

export async function findUsersByName(
  query: FilterQuery<User>,
  options: QueryOptions
) {
  const publicFields = {
    username: 1,
    firstName: 1,
    lastName: 1,
    city: 1,
    state: 1,
    country: 1,
    imageUrl: 1,
    fullName: 1,
    url: 1,
  }

  return UserModel.find(query, options).select(publicFields).lean({ virtuals: true });
}

export async function findAndUpdateUser(
  query: FilterQuery<User>, 
  update: UpdateQuery<User>,
  options: QueryOptions
) {
  return UserModel.findOneAndUpdate(query, update, options);
}

export async function deleteUser(query: FilterQuery<User>) {
  return UserModel.deleteOne(query);
}