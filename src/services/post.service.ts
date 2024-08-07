import {
  FilterQuery,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from "mongoose";
import PostModel, { Post, PostCreate } from "../models/post.model";
import { User } from "../models/user.model";
import logger from "../utils/logger";

export async function createPost(input: PostCreate) {
  try {
    const post = await PostModel.create(input);
    return post.toJSON();
  } catch (e: any) {
    logger.error(e);
    throw new Error(e);
  }
}

export async function findPost(query: FilterQuery<Post>) {
  const result = PostModel.findOne(query)
    .populate<{ author: User }>("author", "-password")
    .lean({ virtuals: true });
  return result;
}

export async function findManyPosts(
  query: FilterQuery<Post>,
  projection?: ProjectionType<Post>,
  options?: QueryOptions
) {
  const result = PostModel.find(query, projection, options)
    .populate<{ author: User }>("author", "-password")
    .lean({ virtuals: true });
  return result;
}

export async function findPostsByUser(query: FilterQuery<Post>) {
  return PostModel.findOne(query).lean();
}

export async function findAndUpdatePost(
  query: FilterQuery<Post>,
  update: UpdateQuery<Post>,
  options: QueryOptions
) {
  return PostModel.findOneAndUpdate(query, update, options);
}

export async function deletePost(query: FilterQuery<Post>) {
  return PostModel.deleteOne(query);
}
