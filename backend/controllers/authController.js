import prisma from "../db/db.config.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const RegisterController = async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (user) {
      return res.status(400).json({ error: "User Already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ creează user + cart în aceeași tranzacție
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      const cart = await tx.cart.create({
        data: {
          userId: newUser.id,
        },
      });

      return { newUser, cart };
    });

    return res.status(201).json(result); // { newUser, cart }
  } catch (error) {
    console.log(error);

    // optional: dacă vrei să prinzi unique conflict (email)
    if (error?.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const SignInController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
