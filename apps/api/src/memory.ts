interface MemoryItem {
  id: string;
  kind: string;
  content: string;
  createdAt: string;
}

const items: MemoryItem[] = [];
let seq = 1;

export function storeMemory(kind: string, content: string) {
  const item: MemoryItem = {
    id: String(seq++),
    kind,
    content,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  return item;
}

export function searchMemory(q: string) {
  const n = q.toLowerCase();
  return items.filter((i) => i.content.toLowerCase().includes(n) || i.kind.toLowerCase().includes(n));
}

export function listMemory() {
  return [...items];
}
