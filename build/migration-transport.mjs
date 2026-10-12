// Keep each Drizzle statement intact for migration runners that use D1 exec's
// newline-separated transport. Applied source SQL and its journal are untouched.
export function migrationTransport(source) {
  return source.split('--> statement-breakpoint').map(statement => {
    let result = '', quote = null;
    for (let i = 0; i < statement.length; i++) {
      const c = statement[i], next = statement[i + 1];
      if (quote) {
        if (c === '\n' || c === '\r') throw new Error('Multiline SQL literal needs explicit migration transport review');
        result += c;
        if (c === quote) {
          if (next === quote) { result += next; i++; }
          else quote = null;
        }
      } else if (c === "'" || c === '"' || c === '`' || c === '[') {
        quote = c === '[' ? ']' : c; result += c;
      } else if (c === '-' && next === '-') {
        while (i < statement.length && statement[i] !== '\n') i++;
        result += ' ';
      } else if (c === '/' && next === '*') {
        const end = statement.indexOf('*/', i + 2);
        if (end < 0) throw new Error('Unclosed SQL comment');
        i = end + 1; result += ' ';
      } else result += /\s/.test(c) ? ' ' : c;
    }
    if (quote) throw new Error('Unclosed SQL quote');
    return result.trim();
  }).filter(Boolean).join('--> statement-breakpoint\n') + '\n';
}
