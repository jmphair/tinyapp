//////////// APP REQUIRES/VARIABLES/ETC ////////////
const express = require("express");
const morgan = require("morgan");
const { getUserByEmail } = require("./helpers");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");

//////////// MIDDLEWARE ////////////
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieSession({ name: "session", keys: ["key1", "key2"] }));

//////////// HELPER FUNCTIONS ////////////
// This function generates random alphanumeric strings that are 6 characters long.
const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

// This function will return only the URLs for the currently logged in user.
const urlsForUser = (userID) => {
  const filteredURLS = {};
  for (let shortURL in urlDatabase) {
    if (userID === urlDatabase[shortURL].userID) {
      filteredURLS[shortURL] = urlDatabase[shortURL];
    }
  }
  return filteredURLS;
};

//////////// DATA SOURCES ////////////
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    hashedPassword:
      "$2a$10$dV0k6t7TCh/tiITg0pRND.9DKNq17iDjlopZb.X50W940jZOmmTpq", // for testing "123"
  },
  aJ48lW: {
    id: "aJ48lW",
    email: "user2@example.com",
    hashedPassword:
      "$2a$10$.FKtRb3ootTFHKY4TlSoMOdw1Wafnf6RmXyUsawxcwxFa5uY./K6i", // for testing "456"
  },
};

//////////// EXAMPLE/TEMP ROUTES ////////////
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//////////// URL ROUTES ////////////
app.get("/urls", (req, res) => {
  const userId = req.session["user_id"];
  const user = users[userId];
  const templateVars = { urls: urlsForUser(userId), user };
  if (!user) {
    return res
      .status(400)
      .send("Please login or register to view your short URLs.");
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session["user_id"];
  const user = users[userId];
  const templateVars = { user };
  if (!user) {
    res.redirect(`/login`);
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session["user_id"];
  const user = users[userId];
  const shortURL = req.params.id;
  if (!urlDatabase.hasOwnProperty(shortURL)) {
    return res.status(400).send("This URL does not exist.");
  }
  if (!req.session["user_id"]) {
    return res.status(400).send("Please login to view this short URL.");
  }
  if (!urlsForUser(userId).hasOwnProperty(shortURL)) {
    return res.status(400).send("You are not authorized to view this link.");
  }
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = {
    id: shortURL,
    userID: userId,
    longURL,
    user,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  if (!longURL) {
    return res.status(400).send("This short URL has not been created.");
  }
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const userId = req.session["user_id"];
  const user = users[userId];
  if (!user) {
    return res
      .status(400)
      .send("Please login or register to create short URLs!");
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, userID: userId };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session["user_id"];
  const shortURL = req.params.id;
  if (!urlDatabase.hasOwnProperty(shortURL)) {
    return res.status(400).send("This URL does not exist.");
  }
  if (!req.session["user_id"]) {
    return res.status(400).send("Please login to delete this short URL.");
  }
  if (!urlsForUser(userId).hasOwnProperty(shortURL)) {
    return res.status(400).send("You are not authorized to delete this link.");
  }
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/urls/:id/edit", (req, res) => {
  const userId = req.session["user_id"];
  const shortURL = req.params.id;
  if (!urlDatabase.hasOwnProperty(shortURL)) {
    return res.status(400).send("This URL does not exist.");
  }
  if (!req.session["user_id"]) {
    return res.status(400).send("Please login to edit this short URL.");
  }
  if (!urlsForUser(userId).hasOwnProperty(shortURL)) {
    return res.status(400).send("You are not authorized to edit this link.");
  }
  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls`);
});

//////////// USER REGISTRATION HANDLER ROUTES ////////////
app.get("/register", (req, res) => {
  const userId = req.session["user_id"];
  const user = users[userId];
  if (user) {
    return res.redirect(`/urls`);
  }
  res.render("user_registration", { user });
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!req.body.email || !req.body.password) {
    return res
      .status(400)
      .send("One or more fields left empty. Please try again.");
  }
  const userID = getUserByEmail(email, users);
  if (userID) {
    return res.status(400).send("Account exists. Please login.");
  }
  const userId = generateRandomString();
  const user = { id: userId, email: req.body.email, hashedPassword };
  users[userId] = user;
  req.session.user_id = userId;
  res.redirect(`/urls`);
});

//////////// LOGIN HANDLER ROUTES ////////////
app.get("/login", (req, res) => {
  const userId = req.session["user_id"];
  const user = users[userId];
  if (user) {
    return res.redirect(`/urls`);
  }
  res.render("user_login", { user });
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const userID = getUserByEmail(email, users);
  if (userID) {
    if (bcrypt.compareSync(password, users[userID].hashedPassword)) {
      req.session.user_id = users[userID].id;
      return res.redirect(`/urls`);
    }
    return res.status(403).send("Wrong password entered.");
  }
  return res.status(403).send("403 - an account doesn't exist.");
});
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/login`);
});

//////////// PORT LISTENER ////////////
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});