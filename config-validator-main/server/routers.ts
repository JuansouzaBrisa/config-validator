import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import {
  createSubmission,
  getSubmissionById,
  getSubmissionsByUser,
  updateSubmissionStatus,
  createDevice,
  getDevicesBySubmission,
  getReviewItemsByDevice,
  updateReviewItem,
  createReviewItem,
  createUser,
  getUserByEmail,
  updateUser,
  getAllUsers,
  deactivateUser,
  activateUser,
} from "./db";
import { hashPassword, verifyPassword, isValidEmail, validatePassword } from "./auth";

// Fixed admin credentials - seeded on first use
const ADMIN_EMAIL = "admin@configvalidator.local";
const ADMIN_PASSWORD = "Admin@2024!";

async function ensureAdminExists() {
  try {
    const existing = await getUserByEmail(ADMIN_EMAIL);
    if (!existing) {
      const passwordHash = hashPassword(ADMIN_PASSWORD);
      await createUser({
        email: ADMIN_EMAIL,
        name: "Administrador",
        passwordHash,
        role: "admin",
      });
      console.log("[Bootstrap] Admin user created:", ADMIN_EMAIL);
    }
  } catch (err) {
    console.warn("[Bootstrap] Could not ensure admin:", err);
  }
}

// Run on startup
ensureAdminExists();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email("Email inválido"),
          name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
          password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        })
      )
      .mutation(async ({ input }) => {
        if (!isValidEmail(input.email)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Email inválido" });
        }

        const passwordValidation = validatePassword(input.password);
        if (!passwordValidation.valid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: passwordValidation.error });
        }

        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
        }

        const passwordHash = hashPassword(input.password);
        await createUser({
          email: input.email,
          name: input.name,
          passwordHash,
          role: "user",
        });

        return { success: true, message: "Usuário registrado com sucesso" };
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email("Email inválido"),
          password: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha incorretos" });
        }

        if (!user.isActive) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Usuário desativado" });
        }

        const isPasswordValid = verifyPassword(input.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha incorretos" });
        }

        await updateUser(user.id, {});

        const sessionToken = await sdk.createSessionToken(user.email || `user_${user.id}`, {
          name: user.name || "",
          expiresInMs: 1000 * 60 * 60 * 24 * 365,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 365 });

        return { success: true, user };
      }),
  }),

  submissions: router({
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1, "Título é obrigatório"),
          ticketLink: z.string().url("Link do chamado deve ser uma URL válida"),
          description: z.string().optional(),
          devices: z
            .array(
              z.object({
                name: z.string().min(1, "Nome do device é obrigatório"),
                configCode: z.string().min(1, "Código de configuração é obrigatório"),
                deviceType: z.string().optional(),
              })
            )
            .min(1, "Pelo menos um device é necessário"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "user") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas novatos podem criar submissões",
          });
        }

        const submission = await createSubmission({
          createdByUserId: ctx.user.id,
          title: input.title,
          ticketLink: input.ticketLink,
          description: input.description,
        });

        const submissionId = submission.insertId as number;

        for (const device of input.devices) {
          const deviceResult = await createDevice({
            submissionId: submissionId,
            name: device.name,
            configCode: device.configCode,
          });

          const deviceId = deviceResult.insertId as number;

          const lines = device.configCode.split("\n");
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim()) {
              await createReviewItem({
                deviceId: deviceId,
                lineNumber: i + 1,
                lineContent: lines[i],
              });
            }
          }
        }

        return { id: submissionId };
      }),

    list: protectedProcedure
      .input(
        z.object({
          status: z.enum(["Pendente", "Em revisão", "Concluído"]).optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const submissions = await getSubmissionsByUser(ctx.user.id, ctx.user.role);

        let filtered = submissions;
        if (input.status) {
          filtered = filtered.filter(s => s.status === input.status);
        }

        return filtered.slice(input.offset, input.offset + input.limit);
      }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const submission = await getSubmissionById(input);
        if (!submission) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Submissão não encontrada" });
        }

        if (ctx.user.role === "user" && submission.createdByUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        const devices = await getDevicesBySubmission(input);
        const devicesWithReviews = await Promise.all(
          devices.map(async device => ({
            ...device,
            reviews: await getReviewItemsByDevice(device.id),
          }))
        );

        return { ...submission, devices: devicesWithReviews };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          submissionId: z.number(),
          status: z.enum(["Pendente", "Em revisão", "Concluído"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas analistas podem atualizar status",
          });
        }

        await updateSubmissionStatus(input.submissionId, input.status);
        return { success: true };
      }),
  }),

  reviews: router({
    submitReview: protectedProcedure
      .input(
        z.object({
          reviewItemId: z.number(),
          reviewStatus: z.enum(["Correto", "Erro", "Desnecessário"]),
          comment: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas analistas podem revisar",
          });
        }

        await updateReviewItem(input.reviewItemId, {
          reviewStatus: input.reviewStatus,
          comment: input.comment,
          reviewedByUserId: ctx.user.id,
        });

        return { success: true };
      }),
  }),

  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admins podem listar usuários" });
      }
      return await getAllUsers();
    }),
    updateRole: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["user", "admin"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admins podem alterar roles" });
        }

        await updateUser(input.userId, { role: input.role });
        return { success: true };
      }),
    deactivate: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admins podem desativar usuários" });
        }

        await deactivateUser(input.userId);
        return { success: true };
      }),
    activate: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admins podem ativar usuários" });
        }

        await activateUser(input.userId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
