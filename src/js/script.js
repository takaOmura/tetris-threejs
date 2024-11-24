import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as SceneUtils from "three/examples/jsm/utils/SceneUtils.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { GlitchPass } from "three/addons/postprocessing/GlitchPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import Stats from "three/examples/jsm/libs/stats.module";
import Mino from "./mino.js";
import { round } from "./util.js";

/**
 * units, constants
 */
const boxUnit = 1;
const baseTime = 1;
const NUMMINOS = 7;
const game = {
  dimensions: {
    height: 20,
    width: 10,
  },
  materials: {},
  field: {
    fixedMino: {},
    coordinates: [],
  },
  time: 0.0,
  /**
   * @type {Mino}
   */
  mino: {},
  scene: {},
  userPause: true,
  gamePause: false,
  hang: {
    isHang: false,
    hangTime: 0.0,
    lowestReached: 0,
  },
  linesDeleted: 0,
  dropWindow: [
    4, 3.5, 3, 2.75, 2.5, 2.25, 2, 1.75, 1.5, 1.25, 1, 0.75, 0.5, 0.4, 0.3, 0.2,
    0.1, 0.075, 0.05,
  ],
  get level() {
    return Math.floor(this.linesDeleted / 10);
  },
  spawnMino: function () {},
  bag: [],
  rotate: function () {},
  fillBag: function () {},
  next: function () {},
  move: function () {},
  render: function () {},
  fixiateMino: function () {},
};
const colors = {
  deepskyblue: 0x00bfff,
  light: 0xfffacd,
};

/**
 * Game logic
 */

THREE.ColorManagement.enabled = false;

/**
 * Base
 */
// const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector("canvas.webgl");

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Scene
game.scene = new THREE.Scene();
game.scene.background = new THREE.Color(0xffffff);

// Stats, fps
const stats = new Stats();
document.body.appendChild(stats.dom);
// Axes Helper
const axesHelper = new THREE.AxesHelper();
game.scene.add(axesHelper);

/**
 * Debug
 */
const gui = new dat.GUI();

/**
 * Lights
 */
(() => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.67);
  game.scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(colors.light, 0.53);
  directionalLight.position.set(0, 25, 25);
  game.scene.add(directionalLight);
  const directionalLightHelper = new THREE.DirectionalLightHelper(
    directionalLight,
    1
  );
  game.scene.add(directionalLightHelper);

  // debug
  const folder = gui.addFolder("lights");
  folder
    .add(directionalLight, "intensity")
    .name("direc intensity")
    .min(0)
    .max(2)
    .step(0.01);
  folder
    .add(ambientLight, "intensity")
    .name("amb intensity")
    .min(0)
    .max(2)
    .step(0.01);
  folder
    .addColor({ ambLight: ambientLight.color.getHex() }, "ambLight")
    .onChange(handleColorChange(ambientLight.color));
  folder.close();
})();

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.y = 16;
camera.position.x = boxUnit * 6;
camera.position.z = 20;
game.scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target = new THREE.Vector3(boxUnit * 6, boxUnit * 10, 0);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * TextureLoader
 */
const texLoader = new THREE.TextureLoader();
const minoTex = texLoader.load("/textures/matcaps/marble4.png");
const minoAOTex = texLoader.load("/textures/matcaps/marble8.png");
const gameBoxTex = texLoader.load("/textures/matcaps/gamebox.jpeg");

const cubeTexLoader = new THREE.CubeTextureLoader();
const environmentMapTex = cubeTexLoader.load([
  "/textures/env/px.png",
  "/textures/env/nx.png",
  "/textures/env/py.png",
  "/textures/env/ny.png",
  "/textures/env/pz.png",
  "/textures/env/nz.png",
]);
environmentMapTex.magFilter = THREE.NearestFilter;
environmentMapTex.minFilter = THREE.NearestFilter;

gameBoxTex.wrapS = THREE.MirroredRepeatWrapping;
gameBoxTex.wrapT = THREE.MirroredRepeatWrapping;
const gameBoxTexH = gameBoxTex.clone();
const gameBoxTexVL = gameBoxTex.clone();
gameBoxTexVL.repeat.set(1, game.dimensions.height);
gameBoxTexVL.repeat.set(1, game.dimensions.height);
gameBoxTexH.repeat.set(game.dimensions.width + 2, 1);

/**
 * materials
 */
const fixedMinoMaterial = new THREE.MeshPhongMaterial();
fixedMinoMaterial.map = minoTex;
// fixedMinoMaterial.bumpMap = minoAOTex
fixedMinoMaterial.bumpScale = 0.01;
fixedMinoMaterial.shininess = 20;
fixedMinoMaterial.envMap = environmentMapTex;
fixedMinoMaterial.reflectivity = 0.29;
fixedMinoMaterial.combine = THREE.MultiplyOperation;

const gameBoxMaterial = new THREE.MeshPhongMaterial();
const gameBoxMaterialV = new THREE.MeshPhongMaterial();
const gameBoxMaterialH = new THREE.MeshPhongMaterial();
gameBoxMaterial.map = gameBoxTex;
gameBoxMaterialV.map = gameBoxTexVL;
gameBoxMaterialH.map = gameBoxTexH;

// gameBoxMaterial.aoMap = gameBoxAOTex

// debug
(() => {
  const folder = gui.addFolder("materials");
  folder
    .add(fixedMinoMaterial, "bumpScale")
    .name("bump mino")
    .min(0)
    .max(2)
    .step(0.01);
  folder.add(fixedMinoMaterial, "shininess").min(0).max(60).step(0.01);
  folder.add(fixedMinoMaterial, "reflectivity").min(0).max(1).step(0.01);
  folder.close();
  // folder.add(gameBoxMaterial, 'aoMapIntensity').name('AO gamebox').min(0).max(2).step(0.01)
})();

/**
 * Objects
 */
const boxGeometry = new THREE.BoxGeometry(boxUnit, boxUnit, boxUnit);
const gameBox = (() => {
  const gameBoxVL = new THREE.Mesh(
    new THREE.BoxGeometry(boxUnit, boxUnit * 20, boxUnit),
    [
      gameBoxMaterialV,
      gameBoxMaterialV,
      gameBoxMaterial,
      gameBoxMaterial,
      gameBoxMaterialV,
      gameBoxMaterialV,
    ]
  );

  const gameBoxVR = new THREE.Mesh(
    new THREE.BoxGeometry(boxUnit, boxUnit * 20, boxUnit).rotateZ(Math.PI),
    [
      gameBoxMaterialV,
      gameBoxMaterialV,
      gameBoxMaterial,
      gameBoxMaterial,
      gameBoxMaterialV,
      gameBoxMaterialV,
    ]
  );
  const gameBoxH = new THREE.Mesh(
    new THREE.BoxGeometry(boxUnit * 12, boxUnit, boxUnit),
    [
      gameBoxMaterial,
      gameBoxMaterial,
      gameBoxMaterialH,
      gameBoxMaterialH,
      gameBoxMaterialH,
      gameBoxMaterialH,
    ]
  );
  gameBoxVR.position.set(
    boxUnit * 11,
    (game.dimensions.height / 2 + 0.5) * boxUnit,
    0
  );
  gameBoxVL.position.set(0, (game.dimensions.height / 2 + 0.5) * boxUnit, 0);
  gameBoxH.position.set((game.dimensions.width / 2 + 0.5) * boxUnit, 0, 0);
  const gameBox = new THREE.Group().add(gameBoxVL, gameBoxVR, gameBoxH);
  gameBox.position.set(0, -1 * boxUnit, 0);
  return gameBox;
})();
game.scene.add(gameBox);

gameInit();
game.fillBag();
game.fillBag();
game.spawnMino(game.bag.shift());
console.log({ game });

window.addEventListener(
  "keydown",
  (event) => {
    if (event.defaultPrevented) {
      return;
    }
    // if (event.code == 'KeyW' || event.code == 'ArrowUp') {
    //     game.move('up')
    if (event.code == "KeyS" || event.code == "ArrowDown") {
      game.move("down");
    } else if (event.code == "KeyA" || event.code == "ArrowLeft") {
      game.move("left");
    } else if (event.code == "KeyD" || event.code == "ArrowRight") {
      game.move("right");
    } else if (event.code == "KeyR") {
      game.rotate("right");
    } else if (event.code == "KeyE") {
      game.rotate("left");
    }
    if (event.code === "KeyP") {
      //        console.log('userPause pressed')
      game.userPause = game.userPause ? false : true;
    }
    if (event.code !== "Tab") {
      event.preventDefault();
    }
  },
  true
);

window.addEventListener(
  "keypress",
  (event) => {
    if (event.defaultPrevented) {
      return;
    }
    if (event.code !== "Tab") {
      event.preventDefault();
    }
  },
  true
);

/**
 * Animate
 */
const clock = new THREE.Clock();

let time = 0;

tick();

function handleColorChange(color) {
  return function (value) {
    if (typeof value === "string") {
      value = value.replace("#", "0x");
    }
    color.setHex(value);
  };
}

function needsUpdate(material) {
  return (value) => {
    material.shininess = value;
    material.needsUpdate = true;
  };
}
for (let index = 0; index <= 30; index++) {}

function tick() {
  if (!game.gamePause) {
    if (!game.userPause) {
      const elapsedTime = clock.getElapsedTime();
      const currentDropWindow = game.dropWindow[Math.min(game.level, 18)];
      if (game.hang.isHang) {
        if (elapsedTime - game.hang.hangTime > currentDropWindow * 5) {
          game.next();
          time = elapsedTime;
        }
      } else if (elapsedTime - time > currentDropWindow) {
        game.next();
        time = elapsedTime;
      }
    }
  }
  // Update controls
  controls.update();

  // Render

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);

  renderer.render(game.scene, camera);
  stats.update();
}

function gameInit() {
  game.field.coordinates = (() => {
    const array = new Array(game.dimensions.width + 2);
    for (let i = 0; i < array.length; i++) {
      array[i] = new Array(game.dimensions.height + 1)
        .fill(0)
        .map((_, index, arr) => {
          return index == arr.length - 1 || i == 0 || i == array.length - 1
            ? 1
            : 0;
        });
    }
    return array;
  })();
  game.field.fixedMino = new THREE.Group();
  game.scene.add(game.field.fixedMino);
  game.hang.isHang = false;
  game.hang.hangTime = 0;
  game.spawnMino = (i) => {
    game.mino = Mino.createMino(boxGeometry, fixedMinoMaterial, i);
    game.scene.add(game.mino.group);
  };
  game.move = (direction) => {
    const positions = game.mino.getPositionOfEachBox();
    const delta = (() => {
      switch (direction) {
        case "left":
          return { x: -1, y: 0 };
        case "right":
          return { x: 1, y: 0 };
        // case 'up':
        //     return [0, -1];
        case "down":
          return { x: 0, y: 1 };
      }
    })();
    const hasNeighbor = positions.some(([x, y, _]) => {
      if (
        x + delta.x > game.dimensions.width ||
        y + delta.y > game.dimensions.height ||
        x + delta.x < 0 ||
        y + delta.y < 0
      ) {
        return true;
      }
      return game.field.coordinates[x + delta.x][y + delta.y] != 0;
    });
    if (!hasNeighbor) {
      game.mino.changePosition([
        game.mino.position[0] + delta.x,
        game.mino.position[1] + delta.y,
      ]);
    } else if (direction == "down" && hasNeighbor) {
      game.fixiateMino();
    }
  };
  game.rotate = (direction) => {
    const dirNum = direction == "left" ? 1 : -1;
    const rotatedPositions = game.mino.getRotatedPositions(dirNum);
    let isOccupied = true;
    let delta = { x: 0, y: 0 };
    for (delta.y = 0; delta.y > -3; delta.y--) {
      for (delta.x = 0; delta.x < 3; delta.x++) {
        isOccupied = rotatedPositions.some(([x, y, _]) => {
          if (
            x + delta.x > game.dimensions.width ||
            y + delta.y > game.dimensions.height ||
            x + delta.x < 0 ||
            y + delta.y < 0
          ) {
            return true;
          }
          return game.field.coordinates[x + delta.x][y + delta.y] != 0;
        });
        if (!isOccupied) break;
      }
      if (!isOccupied) break;
    }
    if (isOccupied) {
      for (delta.y = 0; delta.y > -3; delta.y--) {
        for (delta.x = 0; delta.x > -3; delta.x--) {
          isOccupied = rotatedPositions.some(([x, y, _]) => {
            if (
              x + delta.x > game.dimensions.width ||
              y + delta.y > game.dimensions.height ||
              x + delta.x < 0 ||
              y + delta.y < 0
            ) {
              return true;
            }
            return game.field.coordinates[x + delta.x][y + delta.y] != 0;
          });
          if (!isOccupied) break;
        }
        if (!isOccupied) break;
      }
    }

    if (!isOccupied) {
      game.mino.rotate(dirNum);
      game.mino.changePosition([
        game.mino.position[0] + delta.x,
        game.mino.position[1] + delta.y,
      ]);
    }
  };
  game.fillBag = () => {
    const newNexts = Array.from({ length: NUMMINOS }, (_, i) => i + 1);
    let currentIndex = NUMMINOS;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [newNexts[currentIndex], newNexts[randomIndex]] = [
        newNexts[randomIndex],
        newNexts[currentIndex],
      ];
    }
    game.bag.push(...newNexts);
  };
  game.next = () => {
    const position = game.mino.getPositionOfEachBox();
    const lowestY = position.reduce((min, elem) => Math.max(min, elem[1]), 0);

    const hasNeighborBelow = (() => {
      if (lowestY !== game.dimensions.height - 1) {
        return position.some(
          ([x, y, _]) => game.field.coordinates[x][y + 1] != 0
        );
      } else return true;
    })();

    if (!hasNeighborBelow) {
      if (lowestY >= game.hang.lowestReached) {
        game.hang.isHang = false;
        game.hang.lowestReached = lowestY;
      }
      game.mino.changePosition([position[0][0], position[0][1] + 1]);
    } else {
      if (!game.hang.isHang) {
        game.hang.lowestReached = lowestY;
        game.hang.isHang = true;
        game.hang.hangTime = clock.getElapsedTime();
      } else {
        game.fixiateMino();
      }
    }
  };
  game.fixiateMino = () => {
    game.hang.isHang = false;
    game.hang.lowestReached = 0;
    const field = game.field;
    const positions = game.mino.getPositionOfEachBox();
    positions.forEach(([x, y, box]) => {
      field.coordinates[x][y] = box;
    });
    positions.forEach(([x, y, box]) => {
      box.position.set(boxUnit * x, boxUnit * (19 - y), 0);
      field.fixedMino.add(box);
    });
    game.mino.group.removeFromParent();

    // 移動が必要な数をarrayに収納ノウ
    const arr = new Int16Array(game.dimensions.height - 1).fill(0);
    let numDrop = 0;
    let hadSpace = true;
    for (let i = 19; i >= 0; i--) {
      for (let j = 1; j < game.dimensions.width + 1; j++) {
        hadSpace = field.coordinates[j][i] == 0;
        if (hadSpace) {
          break;
        }
      }
      if (!hadSpace) {
        hadSpace = true;
        numDrop++;
        continue;
      }
      arr[i] = numDrop;
    }

    game.linesDeleted += numDrop;

    for (let i = 18; i >= 0; i--) {
      for (let j = 1; j < game.dimensions.width + 1; j++) {
        const elem = field.coordinates[j][i];
        const target = field.coordinates[j][i + arr[i]];
        if (arr[i] != 0) {
          if (target instanceof THREE.Object3D) {
            field.fixedMino.remove(target);
          }
          field.coordinates[j][i + arr[i]] = elem;
          if (elem instanceof THREE.Object3D) {
            elem.position.set(
              elem.position.x,
              elem.position.y - arr[i] * boxUnit,
              0
            );
          }
          field.coordinates[j][i] = 0;
        }
      }
      // console.warn(game.field.coordinates)
    }
    game.spawnMino(game.bag.shift());
    if (game.bag.length < NUMMINOS + 1) game.fillBag();
  };
}
