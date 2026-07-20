import * as THREE from 'three';

// BNB palette (from public/favicon.svg)
export const BNB_COLORS = {
  violet: '#863bff',
  violetDark: '#7e14ff',
  violetSoft: '#aa3bff',
  blue: '#47bfff',
  lavender: '#ede6ff',
  bg: '#0b0a14',
} as const;

// Node colors by group
export const NODE_COLORS: Record<string, string> = {
  project: BNB_COLORS.violet,
  user: BNB_COLORS.blue,
};

export interface AssignmentData {
  id: string;
  scope_hours: number;
  projects: { id: string; name: string };
  users: { id: string; first_name: string; last_name: string };
}

export interface GraphNode {
  id: string;
  name: string;
  group: 'project' | 'user';
  val: number;
  hours: number;
  connections: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function buildGraphData(data: AssignmentData[]): GraphData {
  const nodesMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  data.forEach(item => {
    if (!item.projects?.id || !item.users?.id) return;
    const pId = `proj_${item.projects.id}`;
    const uId = `user_${item.users.id}`;

    if (!nodesMap.has(pId)) {
      nodesMap.set(pId, {
        id: pId,
        name: item.projects.name,
        group: 'project',
        val: 0,
        hours: 0,
        connections: 0,
      });
    }
    const pNode = nodesMap.get(pId)!;
    pNode.hours += item.scope_hours;
    pNode.val = pNode.hours;
    pNode.connections += 1;

    if (!nodesMap.has(uId)) {
      nodesMap.set(uId, {
        id: uId,
        name: `${item.users.first_name} ${item.users.last_name}`,
        group: 'user',
        val: 0,
        hours: 0,
        connections: 0,
      });
    }
    const uNode = nodesMap.get(uId)!;
    uNode.hours += item.scope_hours;
    uNode.val = uNode.hours;
    uNode.connections += 1;

    links.push({ source: uId, target: pId, value: item.scope_hours });
  });

  return { nodes: Array.from(nodesMap.values()), links };
}

// Aggregation for bar charts
export interface BarDatum {
  label: string;
  hours: number;
  id: string;
  group: 'project' | 'user';
}

export function aggregateByProject(data: AssignmentData[]): BarDatum[] {
  const map = new Map<string, BarDatum>();
  data.forEach(item => {
    if (!item.projects?.id) return;
    const key = item.projects.id;
    if (!map.has(key)) {
      map.set(key, {
        label: item.projects.name,
        hours: 0,
        id: item.projects.id,
        group: 'project',
      });
    }
    map.get(key)!.hours += item.scope_hours;
  });
  return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
}

export function aggregateByUser(data: AssignmentData[]): BarDatum[] {
  const map = new Map<string, BarDatum>();
  data.forEach(item => {
    if (!item.users?.id) return;
    const key = item.users.id;
    if (!map.has(key)) {
      map.set(key, {
        label: `${item.users.first_name} ${item.users.last_name}`,
        hours: 0,
        id: item.users.id,
        group: 'user',
      });
    }
    map.get(key)!.hours += item.scope_hours;
  });
  return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
}

// 3D label sprite: persistent text label rendered above each node
const spriteCache = new Map<string, THREE.Sprite>();

export function makeLabelSprite(text: string): THREE.Sprite {
  if (spriteCache.has(text)) return spriteCache.get(text)!;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const fontSize = 64;
  ctx.font = `bold ${fontSize}px 'Baloo 2', sans-serif`;
  const padding = 24;
  const textWidth = ctx.measureText(text).width;
  canvas.width = textWidth + padding * 2;
  canvas.height = fontSize + padding * 2;

  // Background pill
  ctx.fillStyle = 'rgba(11, 10, 20, 0.85)';
  const r = (canvas.height) / 2;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(canvas.width - r, 0);
  ctx.arcTo(canvas.width, 0, canvas.width, canvas.height, r);
  ctx.lineTo(r, canvas.height);
  ctx.arcTo(0, canvas.height, 0, 0, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(134, 59, 255, 0.6)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Text
  ctx.font = `bold ${fontSize}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }));
  sprite.scale.set(canvas.width / 100, canvas.height / 100, 1);
  sprite.position.set(0, 8, 0);

  spriteCache.set(text, sprite);
  return sprite;
}

export function attachNodeThreeObject(node: any): THREE.Object3D {
  const group = new THREE.Group();
  const color = NODE_COLORS[node.group] ?? BNB_COLORS.violet;

  // Core sphere
  const radius = Math.max(Math.sqrt(node.hours || 1) * 1.2, 2);
  const geom = new THREE.SphereGeometry(radius, 24, 24);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.5,
    metalness: 0.4,
    roughness: 0.35,
  });
  const sphere = new THREE.Mesh(geom, mat);
  group.add(sphere);

  // Outer glow halo
  const haloGeom = new THREE.SphereGeometry(radius * 1.6, 16, 16);
  const haloMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(haloGeom, haloMat));

  // Label
  const label = makeLabelSprite(node.name);
  group.add(label);

  // Hours badge below the node
  const hoursLabel = makeLabelSprite(`${node.hours}h`);
  hoursLabel.position.set(0, -radius - 6, 0);
  group.add(hoursLabel);

  return group;
}

export function attachLinkThreeObject(_link: any): THREE.Object3D {
  const lineGeom = new THREE.BufferGeometry();
  const color = new THREE.Color(BNB_COLORS.violetSoft);
  lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const lineMat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.4,
    linewidth: 2,
  });
  return new THREE.Line(lineGeom, lineMat);
}
