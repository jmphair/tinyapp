//////////// APP REQUIRES/VARIABLES/ETC 
const express = require("express");
const morgan = require('morgan');
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");


//////////// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));


//////////// HELPER FUNCTIONS 
// const getUserByEmail = () => {}

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


//////////// DATA SOURCES 
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
    password: "123",
  },
  aJ48lW: {
    id: "aJ48lW",
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

// helper function move up later


app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { urls: urlsForUser(userId), user };
  if (!user) {
    return res.status(400).send("Please login or register to view your short URLs.");
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { user };
  if (!user) {
    res.redirect(`/login`);
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const shortURL = req.params.id;
  
  if (!urlDatabase.hasOwnProperty(shortURL)) {
    return res.status(400).send("This URL does not exist.");
  }
  if (!req.cookies["user_id"]) {
    return res.status(400).send("Please login to view this short URL."); 
  }
  if (!urlsForUser(userId).hasOwnProperty(shortURL)) {
    return res.status(400).send("You are not authorized to view this link.")
  }
  
  const longURL = urlDatabase[shortURL].longURL;
  // console.log(urlDatabase[shortURL].longURL); // it is showing up
  const templateVars = { 
    id: shortURL,
    userID: userId, 
    longURL, 
    user
  };
  
  res.render("urls_show", templateVars);
});

// in case this happens again, if you don't use "http://" then there may be a cookies bug in Chrome
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  if (!longURL) {
    return res.status(400).send("This short URL has not been created.");
  }
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  // Remember, even though we redirect the GET /urls/new requests to GET /login, we still have to protect the POST /urls route too. Hiding the page to submit new urls isn't enough - a malicious user could use simple curl commands to interact with our server.
  // curl -X POST -d "longURL=http://www.lighthouselabs.com" localhost:8080/urls
  if (!user) {
    return res.status(400).send("Please login or register to create short URLs!");
  }
  
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, userID: userId};

  // console.log("user creating new url:\n", userId);
  // console.log("single object being added:\n", urlDatabase[shortURL]);
  // console.log("entire urlDatabase object:\n", urlDatabase);

  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies["user_id"];
  const shortURL = req.params.id;
  
  if (!urlDatabase.hasOwnProperty(shortURL)) {
    return res.status(400).send("This URL does not exist.");
  }
  if (!req.cookies["user_id"]) {
    return res.status(400).send("Please login to delete this short URL."); 
  }
  if (!urlsForUser(userId).hasOwnProperty(shortURL)) {
    return res.status(400).send("You are not authorized to delete this link.")
  }
  
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/urls/:id/edit", (req, res) => {
  const userId = req.cookies["user_id"];
  const shortURL = req.params.id;
  
  if (!urlDatabase.hasOwnProperty(shortURL)) {
    return res.status(400).send("This URL does not exist.");
  }
  if (!req.cookies["user_id"]) {
    return res.status(400).send("Please login to edit this short URL."); 
  }
  if (!urlsForUser(userId).hasOwnProperty(shortURL)) {
    return res.status(400).send("You are not authorized to edit this link.")
  }
  
  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
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
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!req.body.email || !req.body.password) {
    return res.status(400).send("One or more fields left empty. Please try again.");
  }
  for (const user in users) {
    if (users[user].email === email) {
      return res.status(400).send("Account exists. Please login.");
    }
  };

  const userId = generateRandomString();
  const user = { id: userId, email: req.body.email, hashedPassword };

  users[userId] = user;

  res.cookie("user_id", userId);

  console.log("entire users object:\n", users);
  console.log("just user hashedPassword:\n", user.hashedPassword);

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

  // need to work on the email helper function so my code is DRY... this will get too complicated later! do it now.




app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  for (const user in users) {
    if (users[user].email === email) {
      if (bcrypt.compareSync(password, hashedPassword)) {
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


//////////// PORT LISTENER 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});