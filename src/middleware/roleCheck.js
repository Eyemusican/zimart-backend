// Factory that returns a middleware enforcing at least one of the given roles.
// Always place after the `auth` middleware so req.user is already populated.
const roleCheck = (...allowed) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      message: `Forbidden: requires one of [${allowed.join(', ')}]`,
    });
  }
  next();
};

module.exports = roleCheck;
