export const cameras = [
  { id: "bedroom", name: "Bedroom Camera 01", location: "bedroom", people: 1 },
  { id: "corridor", name: "Corridor Camera 02", location: "corridor", people: 0 },
  { id: "entrance", name: "Entrance Camera 03", location: "entrance", people: 0 },
];

export function findCameras(ids: string[]) {
  return ids
    .map((id) => cameras.find((c) => c.id === id || c.location === id || c.name.toLowerCase().includes(id)))
    .filter(Boolean);
}
