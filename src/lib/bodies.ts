/** Map `./articles/<id>.html` raw imports to `{ [id]: html }`. */
export function loadBodies(files: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [file, html] of Object.entries(files)) {
    const id = file.split('/').pop()!.replace(/\.html$/, '');
    out[id] = html;
  }
  return out;
}
