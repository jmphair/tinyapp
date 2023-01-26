//////////// HELPER FUNCTIONS ////////////


// This function sees if it can find a users email in the database.
const getUserByEmail = (email, users) => {
  for (const userID in users) {
    if (users[userID].email === email) {
      return userID;
    }
  }
  return;
};


//////////// EXPORT ////////////


module.exports = { getUserByEmail };