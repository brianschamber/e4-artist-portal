// hash-password.cjs
const { hashSync } = require("bcryptjs");

// 👇 Change this to the password you want your user to log in with
const password = "Test1234!";

const hash = hashSync(password, 10);

console.log("Plain password:", password);
console.log("BCrypt hash:", hash);
