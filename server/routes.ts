import type { Express } from "express";
import type { Server } from "http";
import { storage } from "../server/storage";
import { api } from "../shared/routes";
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

// Seed function
async function seedDatabase() {
  try {
    const existing = await storage.getConfessions();
    if (existing.length === 0) {
      console.log("Seeding database...");
      const categories = ["Food", "Sleep", "Home", "Thoughts", "Social"];
      const examples = [
        { content: "I dip my pizza in milk.", category: "Food", meTooCount: 12, nopeCount: 89 },
        { content: "I pretend to be on the phone when I see someone I know in public.", category: "Social", meTooCount: 154, nopeCount: 12 },
        { content: "I sleep with socks on.", category: "Sleep", meTooCount: 45, nopeCount: 42 },
        { content: "I judge people by their shoes.", category: "Thoughts", meTooCount: 67, nopeCount: 50 },
        { content: "I haven't washed my jeans in 6 months.", category: "Home", meTooCount: 23, nopeCount: 105 },
      ];

      for (const ex of examples) {
        const c = await storage.createConfession(ex);
        // Add random comments
        await storage.createComment({ 
          confessionId: c.id, 
          content: "Wait, really? That's wild.", 
          authorName: generateAnonymousName() 
        });
        
        // Manually update counts to match seed data (since createConfession defaults to 0)
        // This is a bit hacky for seed but fine for "IStorage" limitation if we don't expose update method
        // Actually I didn't expose generic update method, so I'll just leave them at 0 or update via SQL if I really wanted.
        // But wait, createConfession takes `InsertConfession` which omits meTooCount/nopeCount. 
        // So they will be 0.
        // I should probably add a way to seed with counts or just update them via DB directly in seed.
        // Let's rely on random votes for now or just accept 0 for seed.
        // Actually, let's fix it by updating directly via DB object since I'm in server/routes.ts and can import db if needed, 
        // OR just add a special update method to storage for seeding/admin? 
        // OR just loop voteConfession N times. That's safer.
        
        // Let's just manually update using a direct DB call here for efficiency if I can import DB, 
        // but `seedDatabase` is in `server/routes.ts`... I can import `db` from `./db`.
        // Better: let's just use voteConfession in a loop for a few random ones to simulate activity.
        
        // Simulating votes for the first one:
        for(let i=0; i<ex.meTooCount; i+=10) await storage.voteConfession(c.id, 'meToo'); // approximate
        for(let i=0; i<ex.nopeCount; i+=10) await storage.voteConfession(c.id, 'nope');
      }
      console.log("Database seeded!");
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

// Call seed after a short delay to ensure DB is ready
setTimeout(seedDatabase, 2000);
