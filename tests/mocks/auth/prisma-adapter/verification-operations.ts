import { PrismaClient } from '@prisma/client';

/**
 * Verification token operations for the mock PrismaAdapter
 */
export function createVerificationOperations(prisma: PrismaClient) {
  return {
    createVerificationToken: async (data: { identifier: string; token: string; expires: Date }) => {
      await prisma.verificationToken.create({
        data: {
          identifier: data.identifier,
          token: data.token,
          expires: data.expires,
        },
      });
      return data;
    },

    useVerificationToken: async ({ identifier, token }: { identifier: string; token: string }) => {
      const verificationToken = await prisma.verificationToken.findUnique({
        where: {
          identifier_token: { identifier, token },
        },
      });

      if (!verificationToken) return null;

      await prisma.verificationToken.delete({
        where: {
          identifier_token: { identifier, token },
        },
      });

      return verificationToken;
    },
  };
}
