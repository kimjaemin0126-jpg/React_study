/*
  Warnings:

  - Added the required column `updatedAt` to the `Workspace` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "expiresAt" DATETIME NOT NULL,
    "maxUses" INTEGER,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invite" ("codeHash", "createdAt", "createdById", "expiresAt", "id", "maxUses", "revokedAt", "useCount", "workspaceId") SELECT "codeHash", "createdAt", "createdById", "expiresAt", "id", "maxUses", "revokedAt", "useCount", "workspaceId" FROM "Invite";
DROP TABLE "Invite";
ALTER TABLE "new_Invite" RENAME TO "Invite";
CREATE UNIQUE INDEX "Invite_codeHash_key" ON "Invite"("codeHash");
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "tokenHash" TEXT NOT NULL,
    "removedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Member_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Member" ("createdAt", "id", "nickname", "removedAt", "role", "tokenHash", "workspaceId") SELECT "createdAt", "id", "nickname", "removedAt", "role", "tokenHash", "workspaceId" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_tokenHash_key" ON "Member"("tokenHash");
CREATE TABLE "new_Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT [],
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Workspace" ("createdAt", "id", "name") SELECT "createdAt", "id", "name" FROM "Workspace";
DROP TABLE "Workspace";
ALTER TABLE "new_Workspace" RENAME TO "Workspace";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
