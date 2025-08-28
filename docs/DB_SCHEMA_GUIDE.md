🔑 How to deal with Prisma migration conflicts
1. Agree on a workflow

The most important rule: Only one person should generate migrations at a time.

Developer A: changes schema.prisma → runs prisma migrate dev → commits both schema.prisma and the new migration folder.

Developer B: pulls → runs prisma migrate dev → Prisma applies A’s migration to their local DB.

That way, migrations are applied in the same order for everyone.

2. If both of you made schema changes

This is where conflicts happen. Options:

Option A — Merge carefully

Both devs commit their migrations.

On pull, Prisma will replay migrations in timestamp order.

If they touch the same column/table, you’ll hit errors like you just saw (column already exists).
→ One of you needs to manually merge migrations (edit SQL) so the DB isn’t trying to create duplicate fields.

Option B — Reset and rebase (dev-only)

If you’re still in development and don’t care about losing local data:

Delete all migration folders.

Keep only your latest schema.prisma.

Run:

npx prisma migrate dev --name init


This creates a single clean migration.

Push this to Git.

Teammates reset their DB and re-apply.

3. In Production

Never delete or rewrite migration history.

Instead, resolve by editing the failing migration manually (steps.sql) or by creating a new migration to fix conflicts.

4. Practical Team Guidelines

✅ Always commit both schema.prisma and the migration folder together.
✅ Never edit an old migration that’s already merged.
✅ Use npx prisma migrate dev locally after every pull.
✅ If conflicts keep happening in dev → agree to squash into a fresh migration baseline regularly.