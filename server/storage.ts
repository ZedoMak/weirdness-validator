import { 
  confessions, comments, 
  type Confession, type InsertConfession, 
  type Comment, type InsertComment,
  type VoteType
} from '../shared/schema'
import { db } from "./db";
import { eq, sql, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Confessions
  getConfessions(sort?: 'popular' | 'controversial' | 'newest', category?: string, search?: string): Promise<Confession[]>;
  getConfession(id: number): Promise<Confession | undefined>;
  createConfession(confession: InsertConfession): Promise<Confession>;
  voteConfession(id: number, type: VoteType): Promise<{ meTooCount: number, nopeCount: number } | undefined>;
  
  // Comments
  getComments(confessionId: number): Promise<Comment[]>;
  createComment(comment: InsertComment & { authorName: string }): Promise<Comment>;
  likeComment(id: number): Promise<{ likes: number } | undefined>;
  
  // Stats
  getStats(): Promise<{ totalConfessions: number, totalVotes: number }>;
}

export class DatabaseStorage implements IStorage {
  async getConfessions(sort: 'popular' | 'controversial' | 'newest' = 'newest', category?: string, search?: string): Promise<Confession[]> {
    let query = db.select().from(confessions);
    
    // Apply filters
    const conditions = [];
    if (category) {
      conditions.push(eq(confessions.category, category));
    }
    if (search) {
      conditions.push(sql`lower(${confessions.content}) LIKE lower(${`%${search}%`})`);
    }
    
    // Apply sorting
    // Note: Controversial = closer to 50/50 split with high engagement
    // For simplicity, we can define it as: (meToo + nope) / (abs(meToo - nope) + 1)
    // High total votes + low difference = high controversy
    
    // We handle sorting logic in JS if complex SQL is too much, but for now standard:
    let orderBy;
    if (sort === 'popular') {
      orderBy = desc(sql`${confessions.meTooCount} + ${confessions.nopeCount}`);
    } else if (sort === 'controversial') {
       // SQL for controversy score: total_votes / (abs(diff) + 1)
       orderBy = desc(sql`(${confessions.meTooCount} + ${confessions.nopeCount}) / (ABS(${confessions.meTooCount} - ${confessions.nopeCount}) + 1)`);
    } else {
      orderBy = desc(confessions.createdAt);
    }

    if (conditions.length > 0) {
      return await query.where(sql`${sql.join(conditions, sql` AND `)}`).orderBy(orderBy);
    }
    
    return await query.orderBy(orderBy);
  }

  async getConfession(id: number): Promise<Confession | undefined> {
    const [confession] = await db.select().from(confessions).where(eq(confessions.id, id));
    return confession;
  }

  async createConfession(insertConfession: InsertConfession): Promise<Confession> {
    const [confession] = await db.insert(confessions).values(insertConfession).returning();
    return confession;
  }

  async voteConfession(id: number, type: VoteType): Promise<{ meTooCount: number, nopeCount: number } | undefined> {
    const confession = await this.getConfession(id);
    if (!confession) return undefined;

    const [updated] = await db
      .update(confessions)
      .set({
        meTooCount: type === 'meToo' ? confession.meTooCount + 1 : confession.meTooCount,
        nopeCount: type === 'nope' ? confession.nopeCount + 1 : confession.nopeCount
      })
      .where(eq(confessions.id, id))
      .returning();
    
    return { meTooCount: updated.meTooCount, nopeCount: updated.nopeCount };
  }

  async getComments(confessionId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.confessionId, confessionId)).orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment & { authorName: string }): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async likeComment(id: number): Promise<{ likes: number } | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    if (!comment) return undefined;
    
    const [updated] = await db.update(comments)
      .set({ likes: comment.likes + 1 })
      .where(eq(comments.id, id))
      .returning();
      
    return { likes: updated.likes };
  }
  
  async getStats(): Promise<{ totalConfessions: number, totalVotes: number }> {
    const [counts] = await db
      .select({
        totalConfessions: sql<number>`count(*)`,
        totalVotes: sql<number>`sum(${confessions.meTooCount} + ${confessions.nopeCount})`
      })
      .from(confessions);
      
    return {
      totalConfessions: Number(counts?.totalConfessions || 0),
      totalVotes: Number(counts?.totalVotes || 0)
    };
  }
}

export const storage = new DatabaseStorage();
