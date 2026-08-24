import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    authUser: { userId: string } | null;
    institutionAccess: {
      institutionId: string;
      membershipId: string;
      roleCodes: string[];
      permissionCodes: string[];
    } | null;
    platformRoles: string[] | null;
  }
}
