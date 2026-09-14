import express from "express";
import upload from "../middleware/upload.js";
import { protectUser } from "../middleware/userAuth.js";

const router = express.Router();

router.post("/logo", protectUser, upload.single("logo"), async (req, res) => {
  console.log(req.file);

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No logo uploaded",
    });
  }

  res.json({
    success: true,
    data: {
      url: req.file.path,
      publicId: req.file.filename,
    },
  });
});

export default router;
