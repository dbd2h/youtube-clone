import express from "express";
import {
  watch,
  getUploadVideo,
  postUploadVideo,
  getEditVideo,
  postEditVideo,
  deleteVideo,
  makeVideo,
} from "../controllers/videoController";
import { videoUpload, avatarUpload } from "../middleware";

const videoRouter = express.Router();

videoRouter.get("/:id([0-9a-f]{24})", watch);
videoRouter
  .route("/upload")
  .get(getUploadVideo)
  .post(
    videoUpload.fields([
      { name: "video", maxCount: 1 },
      { name: "thumb", maxCount: 1 },
    ]),
    postUploadVideo
  );
videoRouter
  .route("/:id([0-9a-f]{24})/edit")
  .get(getEditVideo)
  .post(postEditVideo);
videoRouter.get("/:id([0-9a-f]{24})/delete", deleteVideo);
videoRouter.get("/make-video", makeVideo);

export default videoRouter;
