import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { api } from "../shared/routes.js";
import { z } from "zod";

const ADJECTIVES = ["Quirky", "Honest", "Silly", "Brave", "Curious", "Sleepy", "Wild", "Calm", "Happy", "Grumpy", "Sneaky", "Loud"];
const ANIMALS = ["Penguin", "Koala", "Badger", "Fox", "Owl", "Panda", "Sloth", "Tiger", "Bear", "Cat", "Dog", "Rabbit"];

function generateAnonymousName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Confessions Routes
  app.get(api.confessions.list.path, async (req, res) => {
    try {
      const { sort, category, search } = req.query as { sort?: 'popular' | 'controversial' | 'newest', category?: string, search?: string };
      const confessions = await storage.getConfessions(sort, category, search);
      res.json(confessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch confessions" });
    }
  });

  app.get(api.confessions.get.path, async (req, res) => {
    try {
      const confession = await storage.getConfession(Number(req.params.id));
      if (!confession) {
        return res.status(404).json({ message: 'Confession not found' });
      }
      res.json(confession);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch confession" });
    }
  });

  app.post(api.confessions.create.path, async (req, res) => {
    try {
      const input = api.confessions.create.input.parse(req.body);
      const confession = await storage.createConfession(input);
      res.status(201).json(confession);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create confession" });
    }
  });

  app.post(api.confessions.vote.path, async (req, res) => {
    try {
      const { type } = api.confessions.vote.input.parse(req.body);
      const result = await storage.voteConfession(Number(req.params.id), type);
      if (!result) {
        return res.status(404).json({ message: "Confession not found" });
      }
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ message: "Invalid vote request" });
    }
  });

  // Comments Routes
  app.get(api.comments.list.path, async (req, res) => {
    try {
      const comments = await storage.getComments(Number(req.params.id));
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post(api.comments.create.path, async (req, res) => {
    try {
      // Input validation handled by Zod in routes.ts schema, but we need to ensure route params match
      const input = api.comments.create.input.parse(req.body);
      
      const comment = await storage.createComment({
        ...input,
        confessionId: Number(req.params.id),
        authorName: generateAnonymousName()
      });
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to post comment" });
    }
  });

  app.post(api.comments.like.path, async (req, res) => {
    try {
      const result = await storage.likeComment(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ message: "Failed to like comment" });
    }
  });

  // Stats
  app.get(api.stats.get.path, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
