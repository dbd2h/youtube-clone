import mongoose from "mongoose";

const videoSchema = mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  thumbUrl: { type: String, required: true },
  description: { type: String, required: true },
  hashtags: [{ type: String }],
  createdAt: { type: Date, required: true, default: Date.now },
  meta: {
    views: { type: Number, required: true, default: 0 },
    liked: { type: Number, required: true, default: 0 },
  },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
});

videoSchema.static("formatHashtags", function (hashtags) {
  const arr = hashtags.split(",");
  for (let i = 0; i < arr.length; i++) {
    while (arr[i].startsWith("#")) {
      arr[i] = arr[i].slice("#");
    }
  }
  return arr.map((word) => `#${word}`);
});

const Video = mongoose.model("Video", videoSchema);

export default Video;
