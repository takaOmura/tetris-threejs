import * as THREE from 'three'
import { round, mod } from './util.js'
export default class Mino {
    /**
     * 0: up, 1: left, 2: down:, 3: right
     * @type {number}
     */
    rotation;

    /**
     * coordinate of a box of the mino
     * @type {[number, number]}
     */
    position;

    /**
     * THREE.Group
     * @type {THREE.Group}
     */
    group;

    /**
     * unit
     */
    unit;

    /**
     * 1: I, 2: T, 3: L, 4: J, 5:z, 6:s, 7: o
     * 
     *  I:  1   T:  1 2 3
     *      2         4
     *      3 
     *      4
     * 
     *  L:  1     J :  1
     *      2          2
     *      3 4      4 3
     * 
     *  Z:  1 2   S : 3 4  
     *        3 4   1 2
     * 
     */
    type;

    boxes;

    constructor(type, rotation) {
        this.type = type;
        this.rotation = rotation;
    }

    static createMino(geometry, material, type) {

        const mino = new Mino(type, 1)
        const unit = geometry.parameters.height
        const box1 = new THREE.Mesh(geometry, material)
        const box2 = new THREE.Mesh(geometry, material)
        const box3 = new THREE.Mesh(geometry, material)
        const box4 = new THREE.Mesh(geometry, material)
        const position = [0, 0]
        switch (type) {
            case 1:
                box1.position.set(0, 0, 0)
                box2.position.set(unit, 0, 0)
                box3.position.set(unit * 2, 0, 0)
                box4.position.set(unit * 3, 0, 0)
                position[0] = 4
                position[1] = 0
                break;
            case 2:
                box1.position.set(0, 0, 0)
                box2.position.set(unit, 0, 0)
                box3.position.set(unit * 2, 0, 0)
                box4.position.set(unit, unit, 0)
                position[0] = 4
                position[1] = 0
                break;
            case 3:
                box1.position.set(0, 0, 0)
                box2.position.set(unit, 0, 0)
                box3.position.set(unit * 2, 0, 0)
                box4.position.set(unit * 2, unit, 0)
                position[0] = 4
                position[1] = 0
                break;
            case 4:
                box1.position.set(0, 0, 0)
                box2.position.set(unit, 0, 0)
                box3.position.set(unit * 2, 0, 0)
                box4.position.set(0, unit, 0)
                position[0] = 4
                position[1] = 0
                break;
            case 5:
                box1.position.set(0, 0, 0)
                box2.position.set(unit, 0, 0)
                box3.position.set(unit, unit, 0)
                box4.position.set(unit * 2, unit, 0)
                position[0] = 4
                position[1] = 0
                break;
            case 6:
                box1.position.set(0, 0, 0)
                box2.position.set(-unit, 0, 0)
                box3.position.set(-unit, unit, 0)
                box4.position.set(-unit * 2, unit, 0)
                position[0] = 6
                position[1] = 0
                break;
            case 7:
                box1.position.set(0, 0, 0)
                box2.position.set(unit, 0, 0)
                box3.position.set(0, unit, 0)
                box4.position.set(unit, unit, 0)
                position[0] = 5
                position[1] = 0

        }
        mino.boxes = [box1, box2, box3, box4]
        mino.group = new THREE.Group().add(box1, box2, box3, box4)
        mino.unit = unit
        mino.rotation = 0
        mino.changePosition(position)
        return mino
    }

    changePosition(position) {
        this.position = position
        this.group.position.set(this.unit * position[0], this.unit * (19 - position[1]), 0)
    }

    /**
     * 
     * @param {number} direction -1: clockwise, 1: counterclockwise, array coordinate
     * @returns {[[number, number, Mino]]}
     */
    getRotatedPositions(direction) {
        let center = { x: 0, y: 0 }
        const distance = {}
        const positions = this.getPositionOfEachBox();
        if (this.type == 7) {
            return positions
        }
        center = this.getCenter(positions)
        for (const position of positions) {
            distance.x = position[0] - center.x
            distance.y = position[1] - center.y
            position[0] = center.x + distance.y * direction
            position[1] = center.y + distance.x * direction * -1
            //            console.log({ position, x: distance.x, y: distance.y, center })
        }
        return positions
    }

    rotate(direction) {
        if (this.type == 7) {
            return
        }
        const theta = Math.PI / 2 * direction;
        const axis = new THREE.Vector3(0, 0, 1)
        const positions = this.getPositionOfEachBox()
        const groupPosition = this.group.position;
        let center = this.getCenter(positions)
        center.setY(19 * this.unit - center.y)
        groupPosition.sub(center)
        groupPosition.applyAxisAngle(axis, theta)
        groupPosition.add(center)
        this.group.rotateOnAxis(axis, theta)
        const rotatedPositions = this.getRotatedPositions(direction)
        this.position = [rotatedPositions[0][0], rotatedPositions[0][1]]
        this.rotation = mod(this.rotation + direction, 4)
    }


    getCenter(positions) {
        const position = positions[1];
        if (this.type == 1) {
            switch (this.rotation) {
                case 0:
                    return new THREE.Vector3((position[0] + 0.5) * this.unit, (position[1] + 0.5) * this.unit, 0);
                case 1:
                    return new THREE.Vector3((position[0] + 0.5) * this.unit, (position[1] - 0.5) * this.unit, 0);
                case 2:
                    return new THREE.Vector3((position[0] - 0.5) * this.unit, (position[1] - 0.5) * this.unit, 0);
                case 3:
                    return new THREE.Vector3((position[0] - 0.5) * this.unit, (position[1] + 0.5) * this.unit, 0);
            }
        }
        //        console.log('in getCenter', position[0], position[1])
        return new THREE.Vector3(position[0], position[1], 0);
    }
    /**
     * 
     * @returns {[[number, number, THREE.Mesh]]}
     */
    getPositionOfEachBox() {
        const x = this.position[0]
        const y = this.position[1]
        const boxes = this.boxes

        switch (this.type) {
            case 1:
                switch (this.rotation) {
                    case 0:
                        return [
                            [x, y, boxes[0]],
                            [x + 1, y, boxes[1]],
                            [x + 2, y, boxes[2]],
                            [x + 3, y, boxes[3]],
                        ];
                    case 1:
                        return [
                            [x, y, boxes[0]],
                            [x, y - 1, boxes[1]],
                            [x, y - 2, boxes[2]],
                            [x, y - 3, boxes[3]]
                        ];
                    case 2:
                        return [
                            [x, y, boxes[0]],
                            [x - 1, y, boxes[1]],
                            [x - 2, y, boxes[2]],
                            [x - 3, y, boxes[3]]
                        ];
                    case 3:
                        return [
                            [x, y, boxes[0]],
                            [x, y + 1, boxes[1]],
                            [x, y + 2, boxes[2]],
                            [x, y + 3, boxes[3]]
                        ];
                }
            case 2:
                if (this.rotation == 0) {
                    return [
                        [x, y, boxes[0]],
                        [x + 1, y, boxes[1]],
                        [x + 2, y, boxes[2]],
                        [x + 1, y - 1, boxes[3]]
                    ];
                } else if (this.rotation == 1) {
                    return [
                        [x, y, boxes[0]],
                        [x, y - 1, boxes[1]],
                        [x, y - 2, boxes[2]],
                        [x - 1, y - 1, boxes[3]],
                    ];
                } else if (this.rotation == 2) {
                    return [
                        [x, y, boxes[0]],
                        [x - 1, y, boxes[1]],
                        [x - 2, y, boxes[2]],
                        [x - 1, y + 1, boxes[3]]
                    ];
                } else if (this.rotation == 3) {
                    return [
                        [x, y, boxes[0]],
                        [x, y + 1, boxes[1]],
                        [x, y + 2, boxes[2]],
                        [x + 1, y + 1, boxes[3]]
                    ];
                }
            case 3:
                if (this.rotation == 0) {
                    return [
                        [x, y, boxes[0]],
                        [x + 1, y, boxes[1]],
                        [x + 2, y, boxes[2]],
                        [x + 2, y - 1, boxes[3]]
                    ];
                } else if (this.rotation == 1) {
                    return [
                        [x, y, boxes[0]],
                        [x, y - 1, boxes[1]],
                        [x, y - 2, boxes[2]],
                        [x - 1, y - 2, boxes[3]],
                    ];
                } else if (this.rotation == 2) {
                    return [
                        [x, y, boxes[0]],
                        [x - 1, y, boxes[1]],
                        [x - 2, y, boxes[2]],
                        [x - 2, y + 1, boxes[3]]
                    ];
                } else if (this.rotation == 3) {
                    return [
                        [x, y, boxes[0]],
                        [x, y + 1, boxes[1]],
                        [x, y + 2, boxes[2]],
                        [x + 1, y + 2, boxes[3]]
                    ];
                }
            case 4:
                if (this.rotation == 0) {
                    return [
                        [x, y, boxes[0]],
                        [x + 1, y, boxes[1]],
                        [x + 2, y, boxes[2]],
                        [x, y - 1, boxes[3]]
                    ];
                } else if (this.rotation == 1) {
                    return [
                        [x, y, boxes[0]],
                        [x, y - 1, boxes[1]],
                        [x, y - 2, boxes[2]],
                        [x - 1, y, boxes[3]],
                    ];
                } else if (this.rotation == 2) {
                    return [
                        [x, y, boxes[0]],
                        [x - 1, y, boxes[1]],
                        [x - 2, y, boxes[2]],
                        [x, y + 1, boxes[3]]
                    ];
                } else if (this.rotation == 3) {
                    return [
                        [x, y, boxes[0]],
                        [x, y + 1, boxes[1]],
                        [x, y + 2, boxes[2]],
                        [x + 1, y, boxes[3]]
                    ];
                }
            case 5:
                if (this.rotation == 0) {
                    return [
                        [x, y, boxes[0]],
                        [x + 1, y, boxes[1]],
                        [x + 1, y - 1, boxes[2]],
                        [x + 2, y - 1, boxes[3]]
                    ];
                } else if (this.rotation == 1) {
                    return [
                        [x, y, boxes[0]],
                        [x, y - 1, boxes[1]],
                        [x - 1, y - 1, boxes[2]],
                        [x - 1, y - 2, boxes[3]]
                    ];
                } else if (this.rotation == 2) {
                    return [
                        [x, y, boxes[0]],
                        [x - 1, y, boxes[1]],
                        [x - 1, y + 1, boxes[2]],
                        [x - 2, y + 1, boxes[3]]
                    ];
                } else if (this.rotation == 3) {
                    return [
                        [x, y, boxes[0]],
                        [x, y + 1, boxes[1]],
                        [x + 1, y + 1, boxes[2]],
                        [x + 1, y + 2, boxes[3]],
                    ];
                }
            case 6:
                if (this.rotation == 0) {
                    return [
                        [x, y, boxes[0]],
                        [x - 1, y, boxes[1]],
                        [x - 1, y - 1, boxes[2]],
                        [x - 2, y - 1, boxes[3]]
                    ];
                } else if (this.rotation == 1) {
                    return [
                        [x, y, boxes[0]],
                        [x, y + 1, boxes[1]],
                        [x - 1, y + 1, boxes[2]],
                        [x - 1, y + 2, boxes[3]]
                    ];
                } else if (this.rotation == 2) {
                    return [
                        [x, y, boxes[0]],
                        [x + 1, y, boxes[1]],
                        [x + 1, y + 1, boxes[2]],
                        [x + 2, y + 1, boxes[3]]
                    ];
                } else if (this.rotation == 3) {
                    return [
                        [x, y, boxes[0]],
                        [x, y - 1, boxes[1]],
                        [x + 1, y - 1, boxes[2]],
                        [x + 1, y - 2, boxes[3]],
                    ];
                }

            case 7:
                return [
                    [x, y, boxes[0]],
                    [x + 1, y, boxes[1]],
                    [x, y - 1, boxes[2]],
                    [x + 1, y - 1, boxes[3]],
                ];

        }
    }

    numBoxesX() {
        switch (this.type) {
            case 1:
                if (this.rotation % 2 == 0) {
                    return 1
                } else {
                    return 4
                }
            case 2:
                if (this.rotation % 2 == 0) {
                    return 3
                } else {
                    return 2
                }
        }
    }
}

