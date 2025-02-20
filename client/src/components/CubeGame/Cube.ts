import * as THREE from 'three';

export class RoundedBoxGeometry extends THREE.BufferGeometry {
  constructor(size: number, radius: number, radiusSegments: number) {
    super();

    this.type = 'RoundedBoxGeometry';

    radiusSegments = !isNaN(radiusSegments) ? Math.max(1, Math.floor(radiusSegments)) : 1;

    const width = size;
    const height = size;
    const depth = size;

    radius = size * radius;
    radius = Math.min(radius, Math.min(width, Math.min(height, Math.min(depth))) / 2);

    const edgeHalfWidth = width / 2 - radius;
    const edgeHalfHeight = height / 2 - radius;
    const edgeHalfDepth = depth / 2 - radius;

    const rs1 = radiusSegments + 1;
    const totalVertexCount = (rs1 * radiusSegments + 1) << 3;

    const positions = new THREE.Float32BufferAttribute(new Float32Array(totalVertexCount * 3), 3);
    const normals = new THREE.Float32BufferAttribute(new Float32Array(totalVertexCount * 3), 3);

    let cornerVerts: THREE.Vector3[][] = [];
    let cornerNormals: THREE.Vector3[][] = [];
    const normal = new THREE.Vector3();
    const vertex = new THREE.Vector3();
    const vertexPool: THREE.Vector3[] = [];
    const normalPool: THREE.Vector3[] = [];
    const indices: number[] = [];

    const cornerLayout = [
      new THREE.Vector3(1, 1, 1),
      new THREE.Vector3(1, 1, -1),
      new THREE.Vector3(-1, 1, -1),
      new THREE.Vector3(-1, 1, 1),
      new THREE.Vector3(1, -1, 1),
      new THREE.Vector3(1, -1, -1),
      new THREE.Vector3(-1, -1, -1),
      new THREE.Vector3(-1, -1, 1)
    ];

    // Initialize corners
    for (let i = 0; i < 8; i++) {
      cornerVerts[i] = [];
      cornerNormals[i] = [];
    }

    // Generate vertices
    const PIhalf = Math.PI / 2;
    const cornerOffset = new THREE.Vector3(edgeHalfWidth, edgeHalfHeight, edgeHalfDepth);

    for (let y = 0; y <= radiusSegments; y++) {
      const v = y / radiusSegments;
      const va = v * PIhalf;
      const cosVa = Math.cos(va);
      const sinVa = Math.sin(va);

      if (y === radiusSegments) {
        vertex.set(0, 1, 0);
        const vert = vertex.clone().multiplyScalar(radius).add(cornerOffset);
        cornerVerts[0].push(vert);
        vertexPool.push(vert);

        const norm = vertex.clone();
        cornerNormals[0].push(norm);
        normalPool.push(norm);
        continue;
      }

      for (let x = 0; x <= radiusSegments; x++) {
        const u = x / radiusSegments;
        const ha = u * PIhalf;

        vertex.x = cosVa * Math.cos(ha);
        vertex.y = sinVa;
        vertex.z = cosVa * Math.sin(ha);

        const vert = vertex.clone().multiplyScalar(radius).add(cornerOffset);
        cornerVerts[0].push(vert);
        vertexPool.push(vert);

        const norm = vertex.clone().normalize();
        cornerNormals[0].push(norm);
        normalPool.push(norm);
      }
    }

    // Duplicate corners
    for (let i = 1; i < 8; i++) {
      for (let j = 0; j < cornerVerts[0].length; j++) {
        const vert = cornerVerts[0][j].clone().multiply(cornerLayout[i]);
        cornerVerts[i].push(vert);
        vertexPool.push(vert);

        const norm = cornerNormals[0][j].clone().multiply(cornerLayout[i]);
        cornerNormals[i].push(norm);
        normalPool.push(norm);
      }
    }

    // Build geometry
    const lastVertex = rs1 * radiusSegments;
    const cornerVertNumber = rs1 * radiusSegments + 1;

    // Create indices
    for (let i = 0; i < cornerVerts[0].length - 1; i++) {
      const base = i * 8;
      for (let j = 0; j < 7; j++) {
        indices.push(base + j);
        indices.push(base + j + 1);
        indices.push(base + j + 8);
      }
    }

    // Set attributes
    this.setIndex(indices);
    this.setAttribute('position', positions);
    this.setAttribute('normal', normals);

    // Update vertices
    const index = 0;
    for (let i = 0; i < vertexPool.length; i++) {
      positions.setXYZ(
        index + i,
        vertexPool[i].x,
        vertexPool[i].y,
        vertexPool[i].z
      );

      normals.setXYZ(
        index + i,
        normalPool[i].x,
        normalPool[i].y,
        normalPool[i].z
      );
    }
  }
}

export interface CubeOptions {
  size?: number;
  theme?: string;
}

export class Cube {
  private size: number;
  private scene: THREE.Scene;
  private pieces: THREE.Object3D[];
  private edges: THREE.Mesh[];
  private holder: THREE.Object3D;
  private object: THREE.Object3D;
  private animator: THREE.Object3D;

  constructor(scene: THREE.Scene, options: CubeOptions = {}) {
    this.size = options.size || 3;
    this.scene = scene;
    this.pieces = [];
    this.edges = [];

    this.holder = new THREE.Object3D();
    this.object = new THREE.Object3D();
    this.animator = new THREE.Object3D();

    this.holder.add(this.animator);
    this.animator.add(this.object);
    this.scene.add(this.holder);

    this.init();
  }

  private init() {
    const pieceSize = 1;
    const radius = 0.12;
    const radiusSegments = 3;

    const geometry = new RoundedBoxGeometry(pieceSize, radius, radiusSegments);
    const material = new THREE.MeshLambertMaterial();

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        for (let z = 0; z < this.size; z++) {
          if (x === 0 || x === this.size - 1 || 
              y === 0 || y === this.size - 1 || 
              z === 0 || z === this.size - 1) {
            const piece = new THREE.Mesh(geometry, material.clone());
            piece.position.set(
              x - (this.size - 1) / 2,
              y - (this.size - 1) / 2,
              z - (this.size - 1) / 2
            );
            this.pieces.push(piece);
            this.object.add(piece);
          }
        }
      }
    }
  }

  public rotate(axis: string, layer: number, angle: number) {
    const rotationMatrix = new THREE.Matrix4();
    const rotationAxis = new THREE.Vector3();

    switch(axis) {
      case 'x': rotationAxis.set(1, 0, 0); break;
      case 'y': rotationAxis.set(0, 1, 0); break;
      case 'z': rotationAxis.set(0, 0, 1); break;
    }

    rotationMatrix.makeRotationAxis(rotationAxis, angle);

    this.pieces.forEach(piece => {
      const pos = piece.position[axis as 'x' | 'y' | 'z']; //Explicit type assertion needed here
      if (Math.round(pos) === layer) {
        piece.position.applyMatrix4(rotationMatrix);
        piece.rotation.setFromRotationMatrix(
          piece.matrix.multiply(rotationMatrix)
        );
      }
    });
  }

  public update() {
    // Update animation states here
  }
}