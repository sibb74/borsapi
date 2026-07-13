import { chmodSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const target = join(process.cwd(), "dist", "index.js");
const content = readFileSync(target, "utf8");
const withShebang = content.startsWith("#!") ? content : `#!/usr/bin/env node\n${content}`;

writeFileSync(target, withShebang);
chmodSync(target, 0o755);
