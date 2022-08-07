import User from "../models/User";
import Video from "../models/Video";
import Comment from "../models/Comment";
import { hash } from "bcrypt";

export const home = async (req, res) => {
  const videos = await Video.find({}).populate("owner");
  return res.render("./roots/home", { videos });
};

export const getUploadVideo = (req, res) => {
  return res.render("./videos/upload", { pageTitle: "Upload" });
};

export const postUploadVideo = async (req, res) => {
  const {
    body: { title, description, hashtags },
    files: { video, thumb },
    session: {
      user: { _id },
    },
  } = req;
  const isHeroku = process.env.NODE_ENV === "production";
  try {
    const newVideo = await Video.create({
      title,
      fileUrl: isHeroku ? video[0].location : video[0].path,
      thumbUrl: isHeroku ? thumb[0].location : thumb[0].path,
      description,
      hashtags: Video.formatHashtags(hashtags),
      owner: _id,
    });
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
    return res.redirect("/");
  } catch (error) {
    return res.render("./videos/upload", { pageTitle: "Upload" });
  }
};

export const watch = async (req, res) => {
  const {
    params: { id },
  } = req;
  const video = await Video.findById(id).populate("owner").populate("comments");
  if (!video) {
    return res.status(404).render("404");
  }
  return res.render("./videos/watch", { pageTitle: video.title, video });
};

export const getEditVideo = async (req, res) => {
  const {
    params: { id },
  } = req;
  const video = await Video.findById(id);
  console.log(video);
  return res.render("./videos/edit-video", { pageTitle: "Edit Video", video });
};

export const postEditVideo = async (req, res) => {
  const {
    params: { id },
    body: { title, description, hashtags },
  } = req;
  const exists = await Video.exists({ _id: id });
  if (!exists) {
    return res.status(404).render("404");
  }
  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  });
  return res.redirect(`../${id}`);
};

export const search = async (req, res) => {
  const {
    query: { search },
  } = req;
  if (!search) {
    return res.redirect("/");
  }
  const videos = await Video.find({
    title: {
      $regex: new RegExp(search, "i"),
    },
  }).populate("owner");
  return res.render("./roots/searchResult", { pageTitle: search, videos });
};

export const makeVideo = (req, res) => {
  return res.render("./videos/make-video", { pageTitle: "Make Video" });
};

export const deleteVideo = async (req, res) => {
  const {
    params: { id },
  } = req;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404");
  }
  if (req.session.user._id !== String(video.owner)) {
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndDelete(id);
  return res.redirect("/");
};

export const registerView = (req, res) => {};

export const createComment = (req, res) => {};
