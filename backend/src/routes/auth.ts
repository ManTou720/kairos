import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { users, sessions } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username || typeof username !== "string" || username.trim().length === 0) {
    res.status(400).json({ error: "Username is required" });
    return;
  }

  const trimmedUsername = username.trim().toLowerCase();

  // Find or create user
  let user = await db
    .select()
    .from(users)
    .where(eq(users.username, trimmedUsername))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user) {
    const newUser = {
      id: uuidv4(),
      username: trimmedUsername,
      createdAt: Date.now(),
    };
    await db.insert(users).values(newUser);
    user = newUser;
  }

  // Create session
  const token = uuidv4();
  await db.insert(sessions).values({
    token,
    userId: user.id,
    createdAt: Date.now(),
  });

  res.json({
    token,
    user: { id: user.id, username: user.username },
  });
});

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
