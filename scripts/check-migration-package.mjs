import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { migrationTransport } from '../build/migration-transport.mjs';
const source = readFileSync(new URL('../drizzle/0000_cute_daredevil.sql', import.meta.url), 'utf8');
assert.equal(createHash('sha256').update(source).digest('hex'), '21d4a37e67febeca325da37fe71f8f74530c568b06f0ca3c68a51115b6e01dd3');
const transport = migrationTransport(source);
assert.equal(transport.trim().split('\n').length, 34);
const original = new DatabaseSync(':memory:'), packaged = new DatabaseSync(':memory:');
original.exec(source);
const statements = transport.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
assert.equal(statements.length, 34);
for (const statement of statements) {
  assert.ok(!statement.includes('\n'));
  packaged.prepare(statement).run();
}
const schema = db => db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all().map(row => ({...row,sql:row.sql.replace(/\s+/g,' ').trim()}));
assert.deepEqual(schema(packaged), schema(original));
assert.equal(packaged.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='trigger'").get().n, 10);
assert.equal(packaged.prepare('SELECT count(*) AS n FROM budget_policy').get().n, 0);
assert.equal(migrationTransport("SELECT 'a;  b', 'it''s fine'\n;\n"), "SELECT 'a;  b', 'it''s fine' ;\n");
assert.equal(migrationTransport('SELECT 1 /* comment */\n + 2; -- ignored\n'), 'SELECT 1    + 2;\n');
assert.throws(() => migrationTransport("SELECT 'a\nb';"), /Multiline SQL literal/);
console.log('PASS immutable source hash; all34 packaged statements prepare individually; exact normalized schema with10 guards and zero budget rows; quoted content preserved; unsafe multiline literal rejected.');
original.close(); packaged.close();
