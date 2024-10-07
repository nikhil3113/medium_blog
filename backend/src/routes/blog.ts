import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
import { createBlogInput, updateBlogInput } from "@nikhil_31/medium-common";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SERCRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header("authorization") || "";
  const user = await verify(authHeader, c.env.JWT_SERCRET);
  if (user) {
    c.set("userId", user.id as string);
    await next();
  } else {
    c.status(403);
    return c.json({
      message: "Unauthorized",
    });
  }
});

blogRouter.post("/", async (c) => {
  const body = await c.req.json();
  const {success} = createBlogInput.safeParse(body);
  if(!success){
    c.status(411);
    return c.json({
      message: "Inputs are not correct"
    })
  }
  const authorId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.blog.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: Number(authorId),
      },
    });
    return c.json({
      id: blog.id,
    });
  } catch (error) {
    console.log(error);
    c.status(411);
    return c.text("Error creating blog");
  }
});

blogRouter.put("/", async (c) => {
  const body = await c.req.json();
  const {success} = updateBlogInput.safeParse(body);
  if(!success){
    c.status(411);
    return c.json({
      message: "Inputs are not correct"
    })
  }
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.blog.update({
      where: {
        id: body.id,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });
    return c.json({
      id: blog.id,
    });
  } catch (error) {
    console.log(error);
    c.status(411);
    return c.text("Error updating blog");
  }
});

//Todo: Add Pagination
blogRouter.get("/bulk", async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
  
    try {
      const blogs = await prisma.blog.findMany({});
      return c.json({
        blogs,
      });
    } catch (error) {
      console.log(error);
      c.status(411);
      return c.text("Error fetching all blogs");
    }
  });

blogRouter.get("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.blog.findFirst({
      where: {
        id: Number(id),
      },
    });
    return c.json({
      blog,
    });
  } catch (error) {
    console.log(error);
    c.status(411);
    return c.text("Error fetching blog");
  }
});


