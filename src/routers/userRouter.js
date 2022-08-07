import express from "express";
import {
  logout,
  profile,
  getEditProfile,
  postEditProfile,
  getChangePassword,
  postChangePassword,
  startGithubLogin,
  finishGithubLogin,
  startKakaotalk,
  finishKakaotalk,
  subscribe,
  history,
  liked,
} from "../controllers/userController";
import { avatarUpload } from "../middleware";

const userRouter = express.Router();

userRouter.get("/logout", logout);
userRouter.get("/:id([0-9a-f]{24})", profile);
userRouter
  .route("/edit-profile")
  .get(getEditProfile)
  .post(avatarUpload.single("avatar"), postEditProfile);
userRouter
  .route("/change-password")
  .get(getChangePassword)
  .post(postChangePassword);
userRouter.get("/github/start", startGithubLogin);
userRouter.get("/github/finish", finishGithubLogin);
userRouter.get("/kakaotalk/start", startKakaotalk);
userRouter.get("/kakaotalk/finish", finishKakaotalk);
userRouter.get("/subscribe", subscribe);
userRouter.get("/history", history);
userRouter.get("/liked", liked);

export default userRouter;
