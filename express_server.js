//////////// APP REQUIRES/VARIABLES/ETC 
const express = require("express");
const morgan = require('morgan');
const cookieParser = require("cookie-parser");
const generateRandomString = () => {return Math.random().toString(36).substring(2, 8);};
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");


//////////// APPS TO USE 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));


//////////// HELPER FUNCTIONS 
// const getUserByEmail = () => {}
// Played with this for awhile but not sure how to implement it yet... 


//////////// DATA SOURCES 
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "123",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "456",
  },
};


//////////// EXAMPLE/TEMP ROUTES 
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


//////////// URL ROUTES 
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  // console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls`);
});


//////////// USER REGISTRATION HANDLER ROUTES 
app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  if (user) {
    return res.redirect(`/urls`);
  }
  console.log(req.cookies["user_id"]);
  res.render("user_registration", { user });
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("One or more fields left empty. Please try again.");
  }
  for (const user in users) {
    if (users[user].email === email) {
      return res.status(400).send("Account exists. Please login.");
    }
  };

  const userId = generateRandomString();
  const user = { id: userId, email: req.body.email, password: req.body.password };

  users[userId] = user;

  res.cookie("user_id", userId);

  console.log("entire users object:\n", users);
  console.log("just user email:\n", user.email);

  res.redirect(`/urls`);

});

//////////// LOGIN HANDLER ROUTES 
app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  if (user) {
    return res.redirect(`/urls`);
  }
  res.render("user_login", { user });
});

app.post("/login", (req, res) => {
  // need to work on those helper functions so my code is DRY...
  let email = req.body.email;
  let password = req.body.password;
  
  for (const user in users) {
    if (users[user].email === email) {
      if (users[user].password === password) {
        res.cookie("user_id", users[user].id);
        return res.redirect(`/urls`);
      } 
      return res.status(403).send("Wrong password entered.")
    }
  };
  return res.status(403).send("403 - an account doesn't exist.")
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id", req.body.user_id);
  res.redirect(`/login`);
});


//////////// U/:ID ROUTES
// in case this happens again, if you don't use "http://" then there may be a cookies bug in Chrome
app.get("/u/:id", (req, res) => {
  const longURL = `${urlDatabase[req.params.id]}`;
  res.redirect(longURL);
});


//////////// PORT LISTENER 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});