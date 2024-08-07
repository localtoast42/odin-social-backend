import { Request, Response } from "express";
import config from "config";
import { signJwt } from "../utils/jwt.utils";
import { FindUserResult, validatePassword } from "../services/user.service";
import {
  createSession,
  findAndUpdateSession,
  findSessions,
} from "../services/session.service";
import { CreateSessionInput } from "../schemas/session.schema";

export async function createUserSessionHandler(
  req: Request<{}, {}, CreateSessionInput["body"]>,
  res: Response
) {
  const user = await validatePassword(req.body);

  if (!user) {
    return res.status(401).send("Invalid username or password");
  }

  const session = await createSession({
    user: user.id,
    userAgent: req.get("user-agent") || "",
  });

  const accessToken = signJwt(
    { ...user, session: session._id },
    "accessTokenSecret",
    { expiresIn: config.get<string>("accessTokenTtl") }
  );

  const refreshToken = signJwt(
    { ...user, session: session._id },
    "refreshTokenSecret",
    { expiresIn: config.get<string>("refreshTokenTtl") }
  );

  return res.json({ accessToken, refreshToken });
}

export async function getUserSessionsHandler(req: Request, res: Response) {
  const user: FindUserResult = res.locals.user;
  const userId = user._id;

  const sessions = await findSessions({ user: userId, valid: true });

  return res.json({
    data: sessions,
  });
}

export async function deleteUserSessionHandler(req: Request, res: Response) {
  const sessionId: string | null = res.locals.session;

  const updatedSession = await findAndUpdateSession(
    { _id: sessionId },
    { valid: false },
    { new: true }
  );

  return res.json({
    session: updatedSession?.toJSON(),
    accessToken: null,
    refreshToken: null,
  });
}
