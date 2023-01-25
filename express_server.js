const express = require("express");

const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; // default port 8080

const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});


app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = longURL;
  console.log(urlDatabase);
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

app.post("/login", (req, res) => {
  
  res.cookie("username", req.body.username);
  res.redirect(`/urls`);
  
});

app.post("/logout", (req, res) => {
  
  res.clearCookie("username", req.body.username);
  res.redirect(`/urls`);
  
});

// in case this happens again, if you don't use "http://" then there may be a cookies bug
app.get("/u/:id", (req, res) => {
  const longURL = `${urlDatabase[req.params.id]}`;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});