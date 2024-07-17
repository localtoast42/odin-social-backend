import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import UserModel, { User, UserInput } from "../models/user.model.js";

export async function createUser(input: UserInput) {
  try {
    return await UserModel.create(input);
  } catch (e: any) {
    throw new Error(e);
  }
}

export async function findUser(query: FilterQuery<User>) {
  return UserModel.findOne(query).lean();
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