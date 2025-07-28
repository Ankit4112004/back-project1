// random_gen.js
import crypto from "crypto";

// console.log(crypto.randomBytes(32).toString("hex"));

const refreshTokenSecret = crypto.randomBytes(32).toString("hex");
console.log("REFRESH_TOKEN_SECRET:", refreshTokenSecret);