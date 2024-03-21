const authMiddleware = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: 'ユーザー名とパスワードを入力してください' });
    return;
  }
  next();
};

module.exports = authMiddleware;

