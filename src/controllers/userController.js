import Video from "../models/Video";
import User from "../models/User";
import fetch from "cross-fetch";
import bcrypt from "bcrypt";

export const getJoin = (req, res) => {
  return res.render("./roots/join", { pageTitle: "Sign Up" });
};

export const postJoin = async (req, res) => {
  const {
    body: { email, username, name, password, password2 },
  } = req;
  if (password !== password2) {
    const errorMessage = "Password does not match";
    return res
      .status(400)
      .render("./roots/join", { pageTitle: "Sign Up", errorMessage });
  }
  const exists = await User.findOne({ $or: [{ username }, { email }] });
  if (exists) {
    const errorMessage = "Already exist username or email";
    return res
      .status(400)
      .render("./roots/join", { pageTitle: "Sign Up", errorMessage });
  }
  try {
    await User.create({
      email,
      username,
      name,
      password,
    });
    return res.redirect("/login");
  } catch (error) {
    return res.status(400).redirect("/");
  }
};

export const getLogin = (req, res) => {
  return res.render("./roots/login", { pageTitle: "Sign In" });
};

export const postLogin = async (req, res) => {
  const {
    body: { username, password },
  } = req;
  const user = await User.findOne({ username });
  if (!user) {
    const errorMessage = "User doesn`t exist";
    return res
      .status(400)
      .render("./roots/login", { pageTitle: "Sign In", errorMessage });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const errorMessage = "Password incorrect";
    return res
      .status(400)
      .render("./roots/login", { pageTitle: "Sign In", errorMessage });
  }
  console.log(user);
  req.session.loggedIn = true;
  req.session.user = user;
  return res.redirect("/");
};

export const logout = (req, res) => {
  if (req.session) {
    req.session.destroy();
  }
  return res.redirect("/");
};

export const profile = async (req, res) => {
  const {
    params: { id },
  } = req;
  const user = await User.findById(id).populate("videos");
  res.render("./users/profile", { user, pageTitle: user.name });
};

export const getEditProfile = (req, res) => {
  return res.render("./users/edit-profile", { pageTitle: "Edit Profile" });
};

export const postEditProfile = async (req, res) => {
  const {
    session: {
      user: { _id, avatarUrl },
    },
    file,
    body: { email, username, name },
  } = req;
  if (req.session.user.email !== email) {
    const emailExists = await User.exists({ email });
    if (emailExists) {
      return res
        .status(400)
        .render("./users/edit-profile", { pageTitle: "Edit Profile" });
    }
  }
  if (req.session.user.username !== username) {
    const usernameExists = await User.exists({ username });
    if (usernameExists) {
      return res
        .status(400)
        .render("./users/edit-profile", { pageTitle: "Edit Profile" });
    }
  }
  const isHeroku = process.env.NODE_ENV === "production";
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      avatarUrl: file ? (isHeroku ? file.location : file.path) : avatarUrl,
      email,
      username,
      name,
    },
    { new: true }
  );
  req.session.user = updatedUser;
  return res.redirect("/user/edit-profile");
};

export const getChangePassword = (req, res) => {
  res.render("./users/change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
  const {
    session: {
      user: { _id, password },
    },
    body: { oldPassword, newPassword, newPasswordConfirmation },
  } = req;
  const passwordOk = await bcrypt.compare(oldPassword, password);
  if (!passwordOk) {
    const errorMessage = "Password is invalid";
    return res.status(400).render("./users/change-password", {
      pageTitle: "Change Password",
      errorMessage,
    });
  }
  if (newPassword !== newPasswordConfirmation) {
    const errorMessage = "New password doesn`t match";
    return res.status(400).render("./users/change-password", {
      pageTitle: "Change Password",
      errorMessage,
    });
  }
  const user = await User.findById(_id);
  user.password = newPassword;
  await user.save();
  req.session.destroy();
  return res.redirect("/login");
};

export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  console.log(finalUrl);
  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })
  ).json();
  if ("access_token" in tokenRequest) {
    const { access_token } = tokenRequest;
    const apiUrl = "https://api.github.com";
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    console.log(userData);
    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      return res.redirect("/login");
    }
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      user = await User.create({
        avatarUrl: userData.avatar_url,
        name: userData.name ? userData.name : "Unknown",
        username: userData.login,
        email: emailObj.email,
        password: " ",
        socialOnly: true,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const startKakaotalk = (req, res) => {
  const baseUri = "https://kauth.kakao.com/oauth/authorize";
  const config = {
    client_id: process.env.KT_CLIENT,
    response_type: "code",
    redirect_uri: `${process.env.KT_REDIRECT_URL}/user/kakaotalk/finish`,
  };
  const params = new URLSearchParams(config).toString();
  const finalUri = `${baseUri}?${params}`;
  return res.redirect(finalUri);
};

export const finishKakaotalk = (req, res) => {
  const baseUri = "https://kauth.kakao.com/oauth/token";
  const config = {
    grant_type: "authorization_code",
    client_id: process.env.KT_CLIENT,
    redirect_uri: process.env.KT_REDIRECT_URL,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUri = `${baseUri}?${params}`;
  return res.redirect(finalUri);
};

export const subscribe = (req, res) => res.send("Subscribe");

export const history = (req, res) => res.send("History");

export const liked = (req, res) => res.send("Liked");
