import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

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
  }),

  submissions: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        ticketLink: z.string().url(),
        deviceName: z.string().min(1),
        configCode: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const submissionId = await db.createSubmissionWithItems({
          userId: ctx.user.id,
          ...input,
        });
        return { id: submissionId };
      }),

    getDetails: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const details = await db.getSubmissionDetails(input.id);
        if (!details) throw new Error("Submission not found");
        return details;
      }),

    updateLineStatus: protectedProcedure
      .input(z.object({
        itemId: z.number(),
        status: z.enum(["Correto", "Erro", "Desnecessário"]),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Regra de negócio: comentário obrigatório para Erro ou Desnecessário
        if ((input.status === "Erro" || input.status === "Desnecessário") && !input.comment) {
          throw new Error("Comentário é obrigatório para status de Erro ou Desnecessário");
        }

        await db.updateLineStatus({
          ...input,
          reviewerId: ctx.user.id,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
