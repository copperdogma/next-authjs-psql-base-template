import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AdapterAccount } from 'next-auth/adapters';

/**
 * Account operations for the mock PrismaAdapter
 */
export function createAccountOperations(prisma: PrismaClient) {
  return {
    linkAccount: async (data: AdapterAccount) => {
      await prisma.account.create({
        data: {
          id: uuidv4(),
          userId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state,
        },
      });
      return data;
    },

    unlinkAccount: async ({
      provider,
      providerAccountId,
    }: {
      provider: string;
      providerAccountId: string;
    }) => {
      await prisma.account.delete({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
      });
    },
  };
}
