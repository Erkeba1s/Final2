const v = require("../validators/v.auth");
const { validate } = require("../middlewares/validate");

router.post("/register", v.register, validate, register);
router.post("/login", v.login, validate, login);
