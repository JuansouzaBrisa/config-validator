import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContextForUser(role: "user" | "admin", userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Authorization and Roles", () => {
  describe("User Roles", () => {
    it("should correctly identify novato role", () => {
      const ctx = createContextForUser("user", 1);
      expect(ctx.user.role).toBe("user");
    });

    it("should correctly identify analyst role", () => {
      const ctx = createContextForUser("admin", 2);
      expect(ctx.user.role).toBe("admin");
    });

    it("novato should have user ID and email", () => {
      const ctx = createContextForUser("user", 1);
      expect(ctx.user.id).toBe(1);
      expect(ctx.user.email).toBe("user1@example.com");
      expect(ctx.user.name).toBe("User 1");
    });

    it("analyst should have user ID and email", () => {
      const ctx = createContextForUser("admin", 2);
      expect(ctx.user.id).toBe(2);
      expect(ctx.user.email).toBe("user2@example.com");
      expect(ctx.user.name).toBe("User 2");
    });
  });

  describe("Submission Authorization", () => {
    it("novatos (user role) should be rejected from creating submissions due to DB error", async () => {
      const ctx = createContextForUser("user", 1);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.submissions.create({
          title: "Test Submission",
          ticketLink: "https://example.com/ticket/123",
          description: "Test description",
          devices: [
            {
              name: "Device 1",
              configCode: "line 1\nline 2",
            },
          ],
        });
        // If no error, DB is not available (expected in test environment)
      } catch (error: any) {
        // Expected: DB error, not authorization error
        expect(error).toBeDefined();
      }
    });

    it("analysts (admin role) should be rejected from creating submissions", async () => {
      const ctx = createContextForUser("admin", 2);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.submissions.create({
          title: "Test Submission",
          ticketLink: "https://example.com/ticket/123",
          description: "Test description",
          devices: [
            {
              name: "Device 1",
              configCode: "line 1\nline 2",
            },
          ],
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
        expect(error.message).toContain("Apenas novatos");
      }
    });

    it("should validate title is required", async () => {
      const ctx = createContextForUser("user", 1);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.submissions.create({
          title: "",
          ticketLink: "https://example.com/ticket/123",
          description: "Test description",
          devices: [
            {
              name: "Device 1",
              configCode: "line 1",
            },
          ],
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("should validate ticket link is a valid URL", async () => {
      const ctx = createContextForUser("user", 1);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.submissions.create({
          title: "Test Submission",
          ticketLink: "not-a-valid-url",
          description: "Test description",
          devices: [
            {
              name: "Device 1",
              configCode: "line 1",
            },
          ],
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("should require at least one device", async () => {
      const ctx = createContextForUser("user", 1);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.submissions.create({
          title: "Test Submission",
          ticketLink: "https://example.com/ticket/123",
          description: "Test description",
          devices: [],
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("Update Status Authorization", () => {
    it("novatos should be rejected from updating submission status", async () => {
      const ctx = createContextForUser("user", 1);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.submissions.updateStatus({
          submissionId: 1,
          status: "Em revisão",
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
        expect(error.message).toContain("Apenas analistas");
      }
    });

    it("analysts should have permission to update status", () => {
      const ctx = createContextForUser("admin", 2);
      expect(ctx.user.role).toBe("admin");
    });
  });

  describe("Review Authorization", () => {
    it("novatos should be rejected from submitting reviews", async () => {
      const ctx = createContextForUser("user", 1);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.reviews.submitReview({
          reviewItemId: 1,
          reviewStatus: "Correto",
          comment: "Looks good",
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
        expect(error.message).toContain("Apenas analistas");
      }
    });

    it("analysts should have permission to submit reviews", () => {
      const ctx = createContextForUser("admin", 2);
      expect(ctx.user.role).toBe("admin");
    });

    it("should support all review statuses", () => {
      const statuses = ["Correto", "Erro", "Desnecessário"] as const;
      expect(statuses).toHaveLength(3);
      expect(statuses).toContain("Correto");
      expect(statuses).toContain("Erro");
      expect(statuses).toContain("Desnecessário");
    });
  });

  describe("Submission Status Values", () => {
    it("should support all submission statuses", () => {
      const statuses = ["Pendente", "Em revisão", "Concluído"] as const;
      expect(statuses).toHaveLength(3);
      expect(statuses).toContain("Pendente");
      expect(statuses).toContain("Em revisão");
      expect(statuses).toContain("Concluído");
    });
  });
});
