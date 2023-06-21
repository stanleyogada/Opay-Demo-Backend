import Joi from "joi";
import type { NextFunction, Request, Response } from "express";

import UserRepo from "../repos/UserRepo";
import HashPassword from "../utils/HashPassword";
import { INPUT_SCHEMA_EMAIL_ALLOW_TLDS } from "../constants";
import handleInputValidate from "../utils/handleInputValidate";
import handleTryCatch from "../utils/handleTryCatch";
import APIError from "../utils/APIError";

export const getAllUsers = handleTryCatch(async (_, res: Response) => {
  const users = await UserRepo.findManyBy();

  res.status(200).json({
    status: "success",
    data: users,
    count: users.length,
  });
});

export const getOneUser = handleTryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserRepo.findOneBy({ id: +req.params.id });

  if (!user) {
    return next(new APIError("User not found!", 404));
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

export const updateOneUser = handleTryCatch(async (req: Request, res: Response, next: NextFunction) => {
  await handleInputValidate(req.body, next, {
    nickname: Joi.string().min(3).max(30),
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: INPUT_SCHEMA_EMAIL_ALLOW_TLDS },
    }),
  });

  const user = await UserRepo.findOneByAndUpdate({ id: +req.params.id }, req.body);

  if (!user) {
    return next(new APIError("User not found!", 404));
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

export const deleteOneUser = handleTryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserRepo.deleteOneById(req.params.id);

  if (!user) {
    return next(new APIError("User not found!", 404));
  }

  res.status(204).json({});
});

export const updateLoginPasscode = handleTryCatch(async (req: Request, res: Response, next: NextFunction) => {
  await handleInputValidate(req.body, next, {
    old_login_passcode: Joi.string()
      .pattern(new RegExp("^[0-9]{6,6}$"))
      .message('"old_login_passcode" must be six digits'),
    new_login_passcode: Joi.string()
      .pattern(new RegExp("^[0-9]{6,6}$"))
      .message('"new_login_passcode" must be six digits'),
  });

  // @ts-ignore
  const { user } = req;

  const isMatch = await HashPassword.handleCheck(req.body.old_login_passcode, user.login_passcode);
  if (!isMatch) {
    return next(new APIError("Old login passcode is incorrect!", 400));
  }

  const hash = await HashPassword.handleHash(req.body.new_login_passcode);
  await UserRepo.findOneByAndUpdate({ id: user.id }, { login_passcode: hash });

  res.status(200).json({
    status: "success",
    message: "Login passcode updated successfully!",
  });
});
