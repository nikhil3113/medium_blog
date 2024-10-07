import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign } from "hono/jwt";
import { signInInput, signupInput } from "@nikhil_31/medium-common";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SERCRET: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  const body = await c.req.json();
  const { success } = signupInput.safeParse(body);
  console.log(success);
  if (!success) {
    c.status(411);
    return c.json({ error: "Invalid input" });
  }
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const user = await prisma.user.create({
      data: {
        username: body.username,
        password: body.password,
        name: body.name,
      },
    });
    const jwt = await sign({ id: user.id }, c.env.JWT_SERCRET);
    c.status(201);
    return c.text(jwt);
  } catch (error) {
    console.log(error);
    c.status(411);
    return c.text("Invalid");
  }
});

userRouter.post("/signin", async (c) => {
  const body = await c.req.json();
  const { success } = signInInput.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      message: "Inputs are not correct",
    });
  }
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: body.username,
        password: body.password,
      },
    });
    if (!user) {
      c.status(403);
      return c.text("Unauthorized / incorrect creds");
    }
    const jwt = await sign({ id: user.id }, c.env.JWT_SERCRET);
    c.status(201);
    return c.text(jwt);
  } catch (error) {
    console.log(error);
    c.status(411);
    return c.text("Invalid");
  }
});
