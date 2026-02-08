const router = require("express").Router();
const c = require("../cntrls/c.user");
const auth = require("./services/auth");

router.get("/profile", auth, c.profile);

module.exports = router;
