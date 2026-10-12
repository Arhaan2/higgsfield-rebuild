import type { Operation, Project } from "@/src/contracts/studio";

export type LibraryFilter = "all" | Operation;
export type LibrarySort = "updated" | "title";

const titles = new Intl.Collator("en", { sensitivity: "base" });
const updatedTime = (project: Project) => Date.parse(project.updatedAt);
const compareIds = (a: Project, b: Project) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Keep newer saved data when a list and detail response overlap. Equal versions favor the incoming response. */
export function preferNewerProject(current: Project | undefined, incoming: Project): Project {
  if (!current) return incoming;
  if (current.revision > incoming.revision) return current;
  if (current.revision === incoming.revision && updatedTime(current) > updatedTime(incoming)) return current;
  return incoming;
}

/** Refresh only retains returned IDs; pagination appends without duplicate cards. */
export function mergeLibraryProjects(current: readonly Project[], incoming: readonly Project[], append: boolean): Project[] {
  const existing = new Map(current.map(project => [project.id, project]));
  const merged = new Map(append ? existing : []);
  for (const project of incoming) merged.set(project.id, preferNewerProject(merged.get(project.id) || existing.get(project.id), project));
  return [...merged.values()];
}

/** Pure local view: filtering creates a new array before sorting. */
export function queryLibraryProjects(projects: readonly Project[], search: string, filter: LibraryFilter, sort: LibrarySort): Project[] {
  const query = search.trim().toLowerCase();
  return projects.filter(project =>
    (filter === "all" || project.draft.operation === filter) &&
    (!query || project.title.toLowerCase().includes(query) || project.draft.prompt.toLowerCase().includes(query))
  ).sort((a, b) =>
    (sort === "title" ? titles.compare(a.title, b.title) : updatedTime(b) - updatedTime(a)) || compareIds(a, b)
  );
}
