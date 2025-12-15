import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Token tidak ditemukan!" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Token tidak valid!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Token expired!" });
      }
      return res.status(403).json({ success: false, message: "Token tidak valid!" });
    }

    req.user = decoded;

    if (!req.user.user_id) {
      return res.status(403).json({ success: false, message: "Token tidak memiliki user_id yang valid!" });
    }

    next();
  });
};
