import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt.utils.js';
import { reIssueAccessToken } from '../services/session.service.js';

const deserializeUser = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const accessToken = (req.get('authorization') ?? "").replace(/^Bearer\s/, "");
  const refreshToken = req.get('x-refresh') ?? "";

  if (!accessToken) {
    return next();
  }

  const { decoded, expired } = verifyJwt(accessToken, "accessTokenSecret");

  if (decoded) {
    res.locals.user = decoded;
    return next();
  }

  if (expired && refreshToken) {
    const newAccessToken = await reIssueAccessToken({ refreshToken });

    if (newAccessToken) {
      res.setHeader('x-access-token', newAccessToken)
    }

    const result = verifyJwt(newAccessToken as string, "accessTokenSecret");

    res.locals.user = result.decoded;
    return next();
  }

  return next();
};

export default deserializeUser;