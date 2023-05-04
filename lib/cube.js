CubeEvent  = function(source, axis, mask, angle) {
    this.source = source;
    this.axis = axis;
    this.mask = mask;
    this.angle = angle;
}

//prototype is a way to adjust the class after it has been defined
CubeEvent.prototype.getAffectedLocations = function() {
    var c1 = this.source.clone();
    c1.reset();
    c1.transform(this.axis, this.mask, this.angle);
    return c1.getUnsolvedParts();
}

//create a new instance of the cube
Cube = function(){
    this.init();
}

Cube.prototype.init = function(layerCount) {
    //layer count might be the dimensions of the cube maybe????? if yes, change to 3 for 3x3 cube
    if(layerCount <2){
        throw new IllegalArgumentException("layerCount must be at least 2");
    }
    this.layerCount = layerCount;
    this.cornerLocation = new Array(this.NUM_CORNERS);
    this.cornerOrientation = new Array(this.NUM_CORNERS);
    this.listenerList = [];

    if(this.layerCount > 2){
        //array of 12 edges. array size changes with layer count
        this.edgeLocation = new Array((this.layerCount - 2) * 12);
        this.edgeOrientation = new Array(this.edgeLocation.length);
        this.sideLocation = new Array((this.layerCount - 2) * (this.layerCount - 2) * 6);
        this.sideOrientation = new Array(this.sideLocation.length);
    }else{
        this.edgeLocation = this.edgeOrientation = this.sideLocation = this.sideOrientation = new Array(0);        
    }

    this.reset();
}

Cube.prototype.CORNER_PIECE = 0;
Cube.prototype.FACE_PIECE = 1;
Cube.prototype.EDGE_PIECE = 2;
Cube.prototype.CENTER_PIECE = 3;
Cube.prototype.NUM_CORNERS = 8;
Cube.prototype.listenerList= [];
Cube.prototype.quiet=false;
Cube.prototype.quiet=false;

Cube.prototype.cornerLocation=[]; // {0,1,.....,7}
Cube.prototype.cornerOrientation=[]; //{0,1,2}

Cube.prototype.edgeLocation=[]; // {0,1,.....,11}
Cube.prototype.edgeOrientation=[];  //{0,1}

Cube.prototype.sideLocation=[]; // {0,1,.....,5}
Cube.prototype.sideOrientation=[]; //{0,1,2,3}

Cube.prototype.IDENTITY_TRANSFORM=0;
Cube.prototype.SINGLE_AXIS_TRANSFORM=1;
Cube.prototype.GENERAL_TRANSFORM=2;
Cube.prototype.UNKNOWN_TRANSFORM=3;

//corner to face mapping in the order of states {0,1,2}
Cube.prototype.CORNER_FACE_MAPPING = [
    [1,0,2], //urf [up, right, front]
    [4,2,0], //ufl [down, front, right]
    [1,5,0], //ubr [up, back, right]
    [4,0,5], //drb [down, right, back]
    [1,3,5], //ulb [up, left, back]
    [4,5,3], //dbl [down, back, left]
    [1,2,3], //ufl [up, back, left]
    [4,3,2], //dlf [down, back, front]
];

//edge to axii mapping 
//x = 0, y = 1, z = 2
Cube.prototype.EDGE_AXIS_MAPPING = [
    2,
    1,
    2,
    0,
    1,
    0,
    2,
    1,
    2,
    0,
    1,
    0
];

//This array maps edge parts to rotation angles over the three axes of the cube.
// The index for the first dimension represents the location,
// the index for the second dimension the orientation.
// The value 1 represents clockwise angle, -1 represents counterclockwise angle.
Cube.prototype.EDGE_ANGLE_MAPPING = [
    [1, -1], // edge 0 ur
    [1, -1], //      1 rf
    [-1, 1], //      2 dr
    [-1, 1], //      3 bu
    [-1, 1], //      4 rb
    [1, -1], //      5 bd
    [-1, 1], //      6 ul
    [1, -1], //      7 lb
    [1, -1], //      8 dl
    [1, -1], //      9 fu
    [-1, 1], //     10 lf
    [-1, 1] //     11 fd
];

/**
 * This array maps edge parts to the 6 faces of the cube.
 * The index for the first dimension represents the location,
 * the index for the second dimension the orientation.
 * The values represent the 6 faces:
 * 0=right, 1=up, 2=front, 3=left, 4=down, 5=back.
 */
Cube.prototype.EDGE_TO_FACE_MAP = [
    [1, 0], // edge 0 ur
    [0, 2], //      1 rf
    [4, 0], //      2 dr
    [5, 1], //      3 bu
    [0, 5], //      4 rb
    [5, 0], //      5 bd
    [1, 3], //      6 ul
    [3, 5], //      7 lb
    [4, 3], //      8 dl
    [2, 1], //      9 fu
    [3, 2], //     10 lf
    [2, 4] //     11 fd
];

/**
 * This is used for mapping center part orientations
 * to the 6 sides of the cube.
 * <p>
 * The index for the first dimension represents the location,
 * the index for the second dimension the orientation.
 * The values represent the 6 sides.
 */
Cube.prototype.CENTER_SIDE_MAPPING = [
    //[f, r, d, b, l, u ]
    [0, 1, 2, 3, 4, 5] // 0: Front at front, Right at right
    , [5, 1, 0, 2, 4, 3]// 1: Bottom, Right, CR
    , [3, 1, 5, 0, 4, 2]// 2: Back, Right, CR2
    , [2, 1, 3, 5, 4, 0]// 3: Top, Right, CR'
    , [4, 0, 2, 1, 3, 5]// 4: Right, Back, CU
    , [3, 4, 2, 0, 1, 5]// 5: Back, Left, CU2
    , [1, 3, 2, 4, 0, 5] // 6: // Left, Front, CU'
    , [0, 2, 4, 3, 5, 1] // 7: // Front, Top, CF
    , [0, 4, 5, 3, 1, 2] // 8: // Front, Left, CF2
    , [0, 5, 1, 3, 2, 4] // 9: // Front, Bottom, CF'
    , [5, 0, 4, 2, 3, 1] // 10: // Right, Top, CR CU
    , [5, 4, 3, 2, 1, 0] // 11: // Top, Left, CR CU2
    , [5, 3, 1, 2, 0, 4] // 12: // Left, Down, CR CU'
    , [1, 0, 5, 4, 3, 2] // 13: // Right, Front, CR2 CU
    , [4, 3, 5, 1, 0, 2] // 14: // Left, Back, CR2 CU'
    , [2, 0, 1, 5, 3, 4] // 15: // Right, Down, CR' CU
    , [2, 4, 0, 5, 1, 3] // 16: // Down, Left, CR' CU2
    , [2, 3, 4, 5, 0, 1] // 17: // Left, Up, CR' CU'
    , [1, 2, 0, 4, 5, 3] // 18: // Down, Up, CR CF
    , [4, 5, 0, 1, 2, 3] // 19: // Down, Back, CR CF'
    , [3, 2, 1, 0, 5, 4] // 20: // Back, Down, CR2 CF
    , [3, 5, 4, 0, 2, 1] // 21: // Back, Up, CR2 CF'
    , [4, 2, 3, 1, 5, 0] // 22: // Up, Back, CR' CF
    , [1, 5, 3, 4, 2, 0] // 23: // Up, Front, CR' CF'
//[f, r, d, b, l, u ]
];

/* Corner swipe table.
   * First dimension: side part index.
   * Second dimension: orientation.
   * Third dimension: swipe direction
   * Fourth dimension: axis,layermask,angle
   * <pre>
   *             +---+---+---+
   *             |4.0|   |2.0|
   *             +---     ---+
   *             |     1     |
   *             +---     ---+
   *             |6.0|   |0.0|
   * +---+---+---+---+---+---+---+---+---+---+---+---+
   * |4.1|   |6.2|6.1|   |0.2|0.1|   |2.2|2.1|   |4.2|
   * +---     ---+---     ---+---    +---+---     ---+
   * |     3     |     2     |     0     |     5     |
   * +---     ---+---     ---+---    +---+---     ---+
   * |5.2|   |7.1|7.2|   |1.1|1.2|   |3.1|3.2|   |5.1|
   * +---+---+---+---+---+---+---+---+---+---+---+---+
   *             |7.0|   |1.0|
   *             +---     ---+
   *             |     4     |
   *             +---     ---+
   *             |5.0|   |3.0|
   *             +---+---+---+
   * </pre>*/
Cube.prototype.CORNER_SWIPE_TABLE = [
      [// 0 urf
          [//u
              [2, 4, 1], // axis, layerMask, angle
              [0, 4, -1],
              [2, 4, -1],
              [0, 4, 1]
          ],
          [//r
              [1, 4, 1],
              [2, 4, -1],
              [1, 4, -1],
              [2, 4, 1]
          ],
          [//f
              [0, 4, -1],
              [1, 4, 1],
              [0, 4, 1],
              [1, 4, -1]
          ]
      ], [// 1 dfr
          [//d
              [0, 4, 1], // axis, layerMask, angle
              [2, 4, -1],
              [0, 4, -1],
              [2, 4, 1]
          ],
          [//f
              [1, 1, -1], // axis, layerMask, angle
              [0, 4, -1],
              [1, 1, 1],
              [0, 4, 1]
          ],
          [//r
              [2, 4, -1], // axis, layerMask, angle
              [1, 1, -1],
              [2, 4, 1],
              [1, 1, 1]
          ]
      ], [// 2 ubr
          [//u
              [0, 4, 1], // axis, layerMask, angle
              [2, 1, 1],
              [0, 4, -1],
              [2, 1, -1]
          ],
          [//b
              [1, 4, 1], // axis, layerMask, angle
              [0, 4, -1],
              [1, 4, -1],
              [0, 4, 1]
          ],
          [//r
              [2, 1, 1], // axis, layerMask, angle
              [1, 4, 1],
              [2, 1, -1],
              [1, 4, -1]
          ]
      ], [// 3 drb
          [//d
              [2, 1, -1], // axis, layerMask, angle
              [0, 4, -1],
              [2, 1, 1],
              [0, 4, 1]
          ],
          [//r
              [1, 1, -1], // axis, layerMask, angle
              [2, 1, 1],
              [1, 1, 1],
              [2, 1, -1]
          ],
          [//b
              [0, 4, -1], // axis, layerMask, angle
              [1, 1, -1],
              [0, 4, 1],
              [1, 1, 1]
          ]
      ], [// 4 ulb
          [//u
              [2, 1, -1], // axis, layerMask, angle
              [0, 1, 1],
              [2, 1, 1],
              [0, 1, -1]
          ],
          [//l
              [1, 4, 1], // axis, layerMask, angle
              [2, 1, 1],
              [1, 4, -1],
              [2, 1, -1]
          ],
          [//b
              [0, 1, 1], // axis, layerMask, angle
              [1, 4, 1],
              [0, 1, -1],
              [1, 4, -1]
          ]
      ], [// 5 dbl
          [//d
              [0, 1, -1], // axis, layerMask, angle
              [2, 1, 1],
              [0, 1, 1],
              [2, 1, -1]
          ],
          [//b
              [1, 1, -1], // axis, layerMask, angle
              [0, 1, 1],
              [1, 1, 1],
              [0, 1, -1]
          ],
          [//l
              [2, 1, 1], // axis, layerMask, angle
              [1, 1, -1],
              [2, 1, -1],
              [1, 1, 1]
          ]
      ], [// 6 ufl
          [//u
              [0, 1, -1], // axis, layerMask, angle
              [2, 4, -1],
              [0, 1, 1],
              [2, 4, 1]
          ],
          [//f
              [1, 4, 1], // axis, layerMask, angle
              [0, 1, 1],
              [1, 4, -1],
              [0, 1, -1]
          ],
          [//l
              [2, 4, -1], // axis, layerMask, angle
              [1, 4, 1],
              [2, 4, 1],
              [1, 4, -1]
          ]
      ], [// 7 dlf
          [//d
              [2, 4, 1], // axis, layerMask, angle
              [0, 1, 1],
              [2, 4, -1],
              [0, 1, -1]
          ],
          [//l
              [1, 1, -1], // axis, layerMask, angle
              [2, 4, -1],
              [1, 1, 1],
              [2, 4, 1]
          ],
          [//f
              [0, 1, 1], // axis, layerMask, angle
              [1, 1, -1],
              [0, 1, -1],
              [1, 1, 1]
          ]
      ]
  ];

//check if two cubes are equal
Cube.prototype.equals=function(that) {
    return that.getLayerCount() == this.layerCount && Arrays.equals(that.getCornerLocations(), this.cornerLocation) && Arrays.equals(that.getCornerOrientations(), this.cornerOrient) && Arrays.equals(that.getEdgeLocations(), this.edgeLocation) && Arrays.equals(that.getEdgeOrientations(), this.edgeOrientation) && Arrays.equals(that.getSideLocations(), this.sideLocation) && Arrays.equals(that.getSideOrientations(), this.sideOrientation);
}

/**
 * Resets the cube to its initial (ordered) state.
 */
Cube.prototype.reset=function() {
    this.transformType = this.IDENTITY_TRANSFORM;

    var i;
    for (i = 0; i < this.cornerLocation.length; i++) {
        this.cornerLocation[i] = i;
        this.cornerOrient[i] = 0;
    }

    for (i = 0; i < this.edgeLocation.length; i++) {
        this.edgeLocation[i] = i;
        this.edgeOrientation[i] = 0;
    }

    for (i = 0; i < this.sideLocation.length; i++) {
        this.sideLocation[i] = i;
        this.sideOrientation[i] = 0;
    }

    this.fireCubeChanged(new CubeEvent(this, 0, 0, 0));
}

/**
 * Returns true if the cube is in its ordered (solved) state.
 */
Cube.prototype.isSolved=function() {
    var i;
    for (i = 0; i < this.cornerLocation.length; i++) {
        if (this.cornerLocation[i] != i) {
            return false;
        }
        if (this.cornerOrient[i] != 0) {
            return false;
        }
    }
    for (i = 0; i < this.edgeLocation.length; i++) {
        if (this.edgeLocation[i] != i) {
            return false;
        }
        if (this.edgeOrientation[i] != 0) {
            return false;
        }
    }
    for (i = 0; i < this.sideLocation.length; i++) {
        if (this.sideLocation[i] != i) {
            return false;
        }
        if (this.sideOrientation[i] != 0) {
            return false;
        }
    }
    return true;
}

/**
 * Adds a listener for CubeEvent's.
 *
 * A listener must have a cubeTwisted() and a cubeChanged() function.
 */
Cube.prototype.addCubeListener=function(l) {
    this.listenerList[this.listenerList.length]=l;
}
  
/**
 * Removes a listener for CubeEvent's.
 */
Cube.prototype.removeCubeListener=function(l) {
  for (var i=0;i<this.listenerList.length;i++) {
    if (this.listenerList[i]==l) {
      this.listenerList=this.listenerList.slice(0,i)+this.listenerList.slice(i+1);
      break;
    }
  }
}

  /**
   * Notify all listeners that have registered varerest for
   * notification on this event type.
   */
  Cube.prototype.fireCubeTwisted=function(event) {
      if (!this.quiet) {
          // Guaranteed to return a non-null array
          var listeners = this.listenerList;
          // Process the listeners last to first, notifying
          // those that are varerested in this event
          for (var i = listeners.length - 1; i >= 0; i -= 1) {
                  listeners[i].cubeTwisted(event);
          }
      }
  }
  
  /**
   * Notify all listeners that have registered varerest for
   * notification on this event type.
   */
  Cube.prototype.fireCubeChanged=function(event) {
      if (!this.quiet) {
          // Guaranteed to return a non-null array
          var listeners = this.listenerList;
          // Process the listeners last to first, notifying
          // those that are varerested in this event
          for (var i = listeners.length - 1; i >= 0; i -= 1) {
                  listeners[i].cubeChanged(event);
          }
      }
  }
  
      /**
       * Set this to false to prevent notification of listeners.
       * Setting this to true will fire a cubeChanged event.
       */
  Cube.prototype.setQuiet=function(b) {
          if (b != this.quiet) {
              this.quiet = b;
              if (!this.quiet) {
                this.fireCubeChanged(new CubeEvent(this, 0,0,0));
              }
          }
      }
  
  Cube.prototype.isQuiet=function() {
          return this.quiet;
      }
  
      /**
       * Returns the locations of all corner parts.
       */
  
  Cube.prototype.getCornerLocations=function() {
          return this.cornerLocation;
      }
  
      /**
       * Returns the orientations of all corner parts.
       */
  
  Cube.prototype.getCornerOrientations=function() {
          return this.cornerOrient;
      }
  
      /**
       * Sets the locations and orientations of all corner parts.
       */
  
  Cube.prototype.setCorners=function(locations,orientations) {
          {
              this.transformType = this.UNKNOWN_TRANSFORM;
  
              this.cornerLocation=locations.slice(0,this.cornerLocation.length);
              this.cornerOrient=orientations.slice(0,this.cornerOrient.length);
          }
          this.fireCubeChanged(new CubeEvent(this, 0,0,0));
      }
  
      /**
       * Gets the corner part at the specified location.
       */
  
  Cube.prototype.getCornerAt=function(location) {
          return this.cornerLocation[location];
      }
  
      /**
       * Gets the location of the specified corner part.
       */
  
  Cube.prototype.getCornerLocation=function(corner) {
          var i;
          if (this.cornerLocation[corner] == corner) {
              return corner;
          }
          for (i = this.cornerLocation.length - 1; i >= 0; i--) {
              if (this.cornerLocation[i] == corner) {
                  break;
              }
          }
          return i;
      }
  
      /**
       * Returns the number of corner parts.
       */
  
  Cube.prototype.getCornerCount=function() {
          return this.cornerLocation.length;
      }
  
      /**
       * Returns the number of edge parts.
       */
  
  Cube.prototype.getEdgeCount=function() {
          return this.edgeLocation.length;
      }
  
      /**
       * Returns the number of side parts.
       */
  
  Cube.prototype.getSideCount=function() {
          return this.sideLocation.length;
      }
  
      /**
       * Gets the orientation of the specified corner part.
       */
  
  Cube.prototype.getCornerOrientation=function(corner) {
      return this.cornerOrient[this.getCornerLocation(corner)];
  }
  
      /**
       * Returns the locations of all edge parts.
       */
  
  Cube.prototype.getEdgeLocations=function() {
          return this.edgeLocation;
      }
  
      /**
       * Returns the orientations of all edge parts.
       */
  
  Cube.prototype.getEdgeOrientations=function() {
          return this.edgeOrientation;
      }
  
      /**
       * Sets the locations and orientations of all edge parts.
       */
  
  Cube.prototype.setEdges=function(locations, orientations) {
           {
              this.transformType = this.UNKNOWN_TRANSFORM;
              this.edgeLocation=locations.slice(0,this.edgeLocation.length);
              this.edgeOrientations=this.edgeOrientation.slice(0,this.edgeOrientation.length);
          }
          this.fireCubeChanged(new CubeEvent(this, 0,0,0));
      }
  
      /**
       * Gets the edge part at the specified location.
       */
  
  Cube.prototype.getEdgeAt=function(location) {
          return this.edgeLocation[location];
      }
  
      /**
       * Gets the location of the specified edge part.
       */
  
  Cube.prototype.getEdgeLocation=function(edge) {
      var i;
      if (this.edgeLocation[edge] == edge) {
          return edge;
      }
      for (i = this.edgeLocation.length - 1; i >= 0; i--) {
          if (this.edgeLocation[i] == edge) {
              break;
          }
      }
      return i;
  }
  
  /**
   * Gets the orientation of the specified edge part.
   */
  
  Cube.prototype.getEdgeOrientation=function(edge) {
      return this.edgeOrientation[this.getEdgeLocation(edge)];
  }
  
  /**
   * Returns the locations of all side parts.
   */
  
  Cube.prototype.getSideLocations=function() {
      return this.sideLocation;
  }
  
  /**
   * Returns the orientations of all side parts.
   */
  
  Cube.prototype.getSideOrientations=function() {
      return this.sideOrientation;
  }
  
  /**
   * Sets the locations and orientations of all side parts.
   */
  
  Cube.prototype.setSides=function(locations, orientations) {
      {
          this.transformType = this.UNKNOWN_TRANSFORM;
          this.sideLocation=locations.slice(0,this.sideLocation.length);
          this.sideOrientation=orientations.slice(0,this.sideOrientation.length);
      }
      this.fireCubeChanged(new CubeEvent(this, 0, 0, 0));
  }
  
  /**
   * Gets the side part at the specified location.
   */
  
  Cube.prototype.getSideAt=function(location) {
      return this.sideLocation[location];
  }
  
  /**
   * Gets the face on which the sticker of the specified side part can
   * be seen.
   */
  Cube.prototype.getSideFace=function(sidePart) {
      return this.getSideLocation(sidePart) % 6;
  }
  
  /**
   * Gets the location of the specified side part.
   */
  Cube.prototype.getSideLocation=function(side) {
      var i;
      if (this.sideLocation[side] == side) {
          return side;
      }
      for (i = this.sideLocation.length - 1; i >= 0; i--) {
          if (this.sideLocation[i] == side) {
              break;
          }
      }
      return i;
  }
  
  /**
   * Gets the orientation of the specified side part.
   */
  Cube.prototype.getSideOrientation=function(side) {
      return this.sideOrientation[this.getSideLocation(side)];
  }
  
  /**
   * Copies the permutation of the specified cube to this cube.
   *
   * @param tx The cube to be applied to this cube object.
   */
  Cube.prototype.setTo=function(that) {
      if (that.getLayerCount() != this.getLayerCount()) {
          throw ("that.layers=" + that.getLayerCount() + " must match this.layers=" + this.getLayerCount());
      }
  
      this.transformType = that.transformType;
      this.transformAxis = that.transformAxis;
      this.transformAngle = that.transformAngle;
      this.transformMask = that.transformMask;
  
      this.sideLocation=that.getSideLocations().slice(0,this.sideLocation.length);
      this.sideOrientation=that.getSideOrientations().slice(0,this.sideOrientation.length);
      this.edgeLocation=that.getEdgeLocations().slice(0,this.edgeLocation.length);
      this.edgeOrientation=that.getEdgeOrientations().slice(0,this.edgeOrientation.length);
      this.cornerLocation=that.getCornerLocations().slice(0,this.cornerLocation.length);
      this.cornerOrient=that.getCornerOrientations().slice(0,this.cornerOrient.length);
      this.fireCubeChanged(new CubeEvent(this, 0, 0, 0));
  }
  
  /**
   * Returns the number of layers on the x, y and z axis.
   */
  Cube.prototype.getLayerCount=function() {
      return this.layerCount;
  }
  
  /**
   * Transforms the cube and fires a cubeTwisted event. The actual work
   * is done in method transform0.
   *
   * @param  axis  0=x, 1=y, 2=z axis.
   * @param  layerMask A bitmask specifying the layers to be transformed.
   *           The size of the layer mask depends on the value returned by
   *           <code>getLayerCount(axis)</code>. For a 3x3x3 cube, the layer mask has the
   *           following meaning:
   *           7=rotate the whole cube;<br>
   *           1=twist slice near the axis (left, bottom, behind)<br>
   *           2=twist slice in the middle of the axis<br>
   *           4=twist slice far away from the axis (right, top, front)
   * @param  angle  positive values=clockwise rotation<br>
   *                negative values=counterclockwise rotation<br>
   *               1=90 degrees<br>
   *               2=180 degrees
   *
   * @see #getLayerCount()
   */
  Cube.prototype.transform=function(axis, layerMask, angle) {
      // Update transform type
      {
          switch (this.transformType) {
              case this.IDENTITY_TRANSFORM:
                  this.transformAxis = axis;
                  this.transformMask = layerMask;
                  this.transformAngle = angle;
                  this.transformType = this.SINGLE_AXIS_TRANSFORM;
                  break;
              case this.SINGLE_AXIS_TRANSFORM:
                  if (this.transformAxis == axis) {
                      if (this.transformAngle == angle) {
                          if (this.transformMask == layerMask) {
                              this.transformAngle = (this.transformAngle + angle) % 3;
                          } else if ((this.transformMask & layerMask) == 0) {
                              this.transformMask |= layerMask;
                          } else {
                              this.transformType = this.GENERAL_TRANSFORM;
                          }
                      } else {
                          if (this.transformMask == layerMask) {
                              this.transformAngle = (this.transformAngle + angle) % 3;
                          } else {
                              this.transformType = this.GENERAL_TRANSFORM;
                          }
                      }
                  } else {
                      this.transformType = this.GENERAL_TRANSFORM;
                  }
                  break;
          }
  
          // Perform the transform
          this.transform0(axis, layerMask, angle);
      }
  
      // Inform listeners.
      if (!this.isQuiet()) {
          this.fireCubeTwisted(new CubeEvent(this, axis, layerMask, angle));
      }
  }
  
  /**
   * Transforms the cube and fires a cubeTwisted event.
   *
   * @param  axis  0=x, 1=y, 2=z axis.
   * @param  layerMask A bitmask specifying the layers to be transformed.
   *           The size of the layer mask depends on the value returned by
   *           <code>getLayerCount(axis)</code>. For a 3x3x3 cube, the layer mask has the
   *           following meaning:
   *           7=rotate the whole cube;<br>
   *           1=twist slice near the axis (left, bottom, behind)<br>
   *           2=twist slice in the middle of the axis<br>
   *           4=twist slice far away from the axis (right, top, front)
   * @param  angle  positive values=clockwise rotation<br>
   *                negative values=counterclockwise rotation<br>
   *               1=90 degrees<br>
   *               2=180 degrees
   *
   * @see #getLayerCount()
   */
  // protected abstract void transform0(var axis, var layerMask, var angle);
  
  /**
   * Applies the permutation of the specified cube to this cube and fires a
   * cubeChanged event.
   *
   * @param tx The cube to be used to transform this cube object.
   * @exception InvalidArgumentException, if one or more of the values returned
   * by <code>tx.getLayourCount(axis)</code> are different from this cube.
   *
   * @see #getLayerCount()
   */
  
  Cube.prototype.transformFromCube=function(tx) {
      if (tx.getLayerCount() != this.getLayerCount()) {
          throw ("tx.layers=" + tx.getLayerCount() + " must match this.layers=" + this.getLayerCount());
      }
  
      
  
      var taxis = 0, tangle = 0, tmask = 0;
       {
           {
              {
                  var atx = tx;
                  switch (atx.transformType) {
                      case this.IDENTITY_TRANSFORM:
                          return; // nothing to do
                      case SINGLE_AXIS_TRANSFORM:
                          taxis = atx.transformAxis;
                          tangle = atx.transformAngle;
                          tmask = atx.transformMask;
                          break;
                  }
              }
  
              if (tmask == 0) {
                  this.transformType = this.UNKNOWN_TRANSFORM;
                  var tempLoc;
                  var tempOrient;
  
                  tempLoc = this.cornerLocation.slice(0);
                  tempOrient = this.cornerOrient.slice(0);
                  var txLoc = tx.getCornerLocations();
                  var txOrient = tx.getCornerOrientations();
                  for (var i = 0; i < txLoc.length; i++) {
                      this.cornerLocation[i] = tempLoc[txLoc[i]];
                      this.cornerOrient[i] = (tempOrient[txLoc[i]] + txOrient[i]) % 3;
                  }
  
                  tempLoc = this.edgeLocation.slice(0);
                  tempOrient = this.edgeOrientation.slice(0);
                  txLoc = tx.getEdgeLocations();
                  txOrient = tx.getEdgeOrientations();
                  for (var i = 0; i < txLoc.length; i++) {
                      this.edgeLocation[i] = tempLoc[txLoc[i]];
                      this.edgeOrientation[i] = (tempOrient[txLoc[i]] + txOrient[i]) % 2;
                  }
  
                  tempLoc = this.sideLocation.slice(0);
                  tempOrient = this.sideOrientation.slice(0);
                  txLoc = tx.getSideLocations();
                  txOrient = tx.getSideOrientations();
                  for (var i = 0; i < txLoc.length; i++) {
                      this.sideLocation[i] = tempLoc[txLoc[i]];
                      this.sideOrientation[i] = (tempOrient[txLoc[i]] + txOrient[i]) % 4;
                  }
              }
          }
      }
      if (tmask == 0) {
          this.fireCubeChanged(new CubeEvent(this, 0, 0, 0));
      } else {
          this.transform(taxis, tmask, tangle);
      }
  }
  
  /**
   * Performs a two cycle permutation and orientation change.
   */
  Cube.prototype.twoCycle=function(
          loc, l1, l2,
          orient, o1, o2,
          modulo) {
      var swap;
  
      swap = loc[l1];
      loc[l1] = loc[l2];
      loc[l2] = swap;
  
      swap = orient[l1];
      orient[l1] = (orient[l2] + o1) % modulo;
      orient[l2] = (swap + o2) % modulo;
  }
  
  /**
   * Performs a four cycle permutation and orientation change.
   */
  Cube.prototype.fourCycle=function(
           loc,  l1,  l2,  l3,  l4,
           orient,  o1,  o2,  o3,  o4,
           modulo) {
      var swap;
  
      swap = loc[l1];
      loc[l1] = loc[l2];
      loc[l2] = loc[l3];
      loc[l3] = loc[l4];
      loc[l4] = swap;
  
      swap = orient[l1];
      orient[l1] = (orient[l2] + o1) % modulo;
      orient[l2] = (orient[l3] + o2) % modulo;
      orient[l3] = (orient[l4] + o3) % modulo;
      orient[l4] = (swap + o4) % modulo;
  }
  
  /**
   * Returns the face at which the indicated orientation
   * of the part is located.
   */
  Cube.prototype.getPartFace=function( part,  orient) {
      {
          if (part < this.cornerLocation.length) {
              return getCornerFace(part, orient);
          } else if (part < this.cornerLocation.length + this.edgeLocation.length) {
              return getEdgeFace(part - this.cornerLocation.length, orient);
          } else if (part < this.cornerLocation.length + this.edgeLocation.length + this.sideLocation.length) {
              return getSideFace(part - this.cornerLocation.length - this.edgeLocation.length);
          } else {
              return getCenterSide(orient);
          }
      }
  }
  
  /**
   * Returns the orientation of the specified part.
   */
  Cube.prototype.getPartOrientation=function( part) {
      if (part < this.cornerLocation.length) {
          return this.getCornerOrientation(part);
      } else if (part < this.cornerLocation.length + this.edgeLocation.length) {
          return this.getEdgeOrientation(part - this.cornerLocation.length);
      } else if (part < this.cornerLocation.length + this.edgeLocation.length + this.sideLocation.length) {
          return this.getSideOrientation(part - this.cornerLocation.length - this.edgeLocation.length);
      } else {
          return this.getCubeOrientation();
      }
  }
  
  /**
   * Returns the location of the specified part.
   */
  Cube.prototype.getPartLocation=function( part) {
      if (part < this.cornerLocation.length) {
          return this.getCornerLocation(part);
      } else if (part < this.cornerLocation.length + this.edgeLocation.length) {
          return this.cornerLocation.length + this.getEdgeLocation(part - this.cornerLocation.length);
      } else if (part < this.cornerLocation.length + this.edgeLocation.length + this.sideLocation.length) {
          return this.cornerLocation.length + this.edgeLocation.length + this.getSideLocation(part - this.cornerLocation.length - this.edgeLocation.length);
      } else {
          return 0;
      }
  }
  
  /**
   * Returns the current axis on which the orientation of the part lies.
   * Returns -1 if the part lies on none or multiple axis (the center part).
   */
  Cube.prototype.getPartAxis=function( part,  orientation) {
      if (part < this.cornerLocation.length) {
          // Corner parts
          var face = getPartFace(part, orientation);
          return (face) % 3;
      } else if (part < this.cornerLocation.length + this.edgeLocation.length) {
          // Edge parts
          return EDGE_TO_AXIS_MAP[getEdgeLocation(part - this.cornerLocation.length) % 12];
      } else if (part < this.cornerLocation.length + this.edgeLocation.length + this.sideLocation.length) {
          // Side parts
          var face = getPartFace(part, orientation);
          return (face) % 3;
      } else {
          return -1;
      }
  }
  
  /**
   * Returns the angle which is clockwise for the specified part orientation.
   * Returns 1 or -1.
   * Returns 0 if the direction can not be determined (the center part).
   */
  
  Cube.prototype.getPartAngle=function( part,  orientation) {
      if (part >= this.cornerLocation.length && part < this.cornerLocation.length + this.edgeLocation.length) {
          // Edge parts
          return EDGE_TO_ANGLE_MAP[getEdgeLocation(part - this.cornerLocation.length) % 12][(getEdgeOrientation(part - this.cornerLocation.length) + orientation) % 2];
      } else {
          // Corner parts and Side parts
          var side = getPartFace(part, orientation);
          switch (side) {
              case 0:
              case 1:
              case 2:
                  return 1;
              case 3:
              case 4:
              case 5:
              default:
                  return -1;
          }
      }
  }
  
  /**
   * Returns the current layer mask on which the orientation of the part lies.
   * Returns 0 if no mask can be determined (the center part).
   */
  
  // public abstract var getPartLayerMask(var part, var orientation);
  
  /**
   * Returns the type of the specified part.
   */
  
  Cube.prototype.getPartType=function(part) {
      if (part < this.cornerLocation.length) {
          return CORNER_PART;
      } else if (part < this.cornerLocation.length + this.edgeLocation.length) {
          return EDGE_PART;
      } else if (part < this.cornerLocation.length + this.edgeLocation.length + this.sideLocation.length) {
          return SIDE_PART;
      } else {
          return CENTER_PART;
      }
  }
  
  /**
   * Returns the location of the specified part.
   */
  Cube.prototype.getPartAt=function(location) {
      if (location < this.cornerLocation.length) {
          return this.getCornerAt(location);
      } else if (location < this.cornerLocation.length + this.edgeLocation.length) {
          return this.cornerLocation.length + this.getEdgeAt(location - this.cornerLocation.length);
      } else if (location < this.cornerLocation.length + this.edgeLocation.length + this.sideLocation.length) {
          return this.cornerLocation.length + this.edgeLocation.length + this.getSideAt(location - this.cornerLocation.length - this.edgeLocation.length);
      } else {
          return this.cornerLocation.length + this.edgeLocation.length + this.sideLocation.length;
      }
  }
  
  /**
   * Returns the side at which the indicated orientation
   * of the center part is located.
   *
   * @return The side. A value ranging from 0 to 5.
   * <code><pre>
   *     +---+
   *     | 5 |
   * +---+---+---+---+
   * | 4 | 0 | 1 | 3 |
   * +---+---+---+---+
   *     | 2 |
   *     +---+
   * </pre></code>
   */
  Cube.prototype.getCenterSide=function(orient) {
      return CENTER_TO_SIDE_MAP[getCubeOrientation()][orient];
  }
  
      /**
       * Returns the face an which the sticker at the specified orientation
       * of the edge can be seen.
       */
      Cube.prototype.getEdgeFace=function(edge, orient) {
          var loc = getEdgeLocation(edge) % 12;
          var ori = (this.edgeOrientation[loc] + orient) % 2;
  
          return EDGE_TO_FACE_MAP[loc][ori];
      }
  
      /**
       * Returns the face on which the sticker at the specified orientation
       * of the corner can be seen.
       */
      Cube.prototype.getCornerFace=function(corner, orient) {
          var loc = getCornerLocation(corner);
          var ori = (3 + orient - this.cornerOrient[loc]) % 3;
          return CORNER_TO_FACE_MAP[loc][ori];
      }
  
      /**
       * Returns the orientation of the whole cube.
       * @return The orientation of the cube, or -1 if
       * the orientation can not be determined.
       */
  
  Cube.prototype.getCubeOrientation=function() {
          // The cube has no orientation, if it has no side parts.
          if (this.sideLocation.length == 0) {
              return -1;
          }
  
          // The location of the front side and the right
          // side are used to determine the orientation
          // of the cube.
          switch (this.sideLocation[2] * 6 + this.sideLocation[0]) {
              case 2 * 6 + 0:
                  return 0; // Front at front, Right at right
              case 4 * 6 + 0:
                  return 1; // Front at Bottom, Right at right, CR
              case 5 * 6 + 0:
                  return 2; // Back, Right, CR2
              case 1 * 6 + 0:
                  return 3; // Top, Right, CR'
              case 0 * 6 + 5:
                  return 4; // Right, Back, CU
              case 5 * 6 + 3:
                  return 5; // Back, Left, CU2
              case 3 * 6 + 2:
                  return 6; // Left, Front, CU'
              case 2 * 6 + 1:
                  return 7; // Front, Top, CF
              case 2 * 6 + 3:
                  return 8; // Front, Left, CF2
              case 2 * 6 + 4:
                  return 9; // Front, Bottom, CF'
              case 0 * 6 + 1:
                  return 10; // Right, Top, CR CU
              case 1 * 6 + 3:
                  return 11; // Top, Left, CR CU2
              case 3 * 6 + 4:
                  return 12; // Left, Down, CR CU'
              case 0 * 6 + 2:
                  return 13; // Right, Front, CR2 CU
              case 3 * 6 + 5:
                  return 14; // Left, Back, CR2 CU'
              case 0 * 6 + 4:
                  return 15; // Right, Down, CR' CU
              case 4 * 6 + 3:
                  return 16; // Down, Left, CR' CU2
              case 3 * 6 + 1:
                  return 17; // Left, Up, CR' CU'
              case 4 * 6 + 1:
                  return 18; // Down, Up, CR CF
              case 4 * 6 + 5:
                  return 19; // Down, Back, CR CF'
              case 5 * 6 + 4:
                  return 20; // Back, Down, CR2 CF
              case 5 * 6 + 1:
                  return 21; // Back, Up, CR2 CF'
              case 1 * 6 + 5:
                  return 22; // Up, Back, CR' CF
              case 1 * 6 + 2:
                  return 23; // Up, Front, CR' CF'
              default:
                  return -1;
          }
      }
  
  
  
  Cube.prototype.getPartCount=function() {
      return getCornerCount() + getEdgeCount() + getSideCount() + 1;
  }
  
      /**
       * Returns an array of part ID's, for each part in this cube,
       * which is not at its initial location or has not its initial
       * orientation.
       */
  
  Cube.prototype.getUnsolvedParts=function() {
      var a = new Array(this.cornerLocation.length + this.edgeLocation.length + this.sideLocation.length);
      var count = 0;
      for (var i = 0; i < this.cornerLocation.length; i++) {
          if (this.cornerLocation[i] != i || this.cornerOrient[i] != 0) {
              a[count++] = i;
          }
      }
      for (var i = 0; i < this.edgeLocation.length; i++) {
          if (this.edgeLocation[i] != i || this.edgeOrientation[i] != 0) {
              a[count++] = i + this.cornerLocation.length;
          }
      }
      for (var i = 0; i < this.sideLocation.length; i++) {
          if (this.sideLocation[i] != i || this.sideOrientation[i] != 0) {
              a[count++] = i + this.cornerLocation.length + this.edgeLocation.length;
          }
      }
      var result = new Array(count);
      result=a.slice(0,count);
      return result;
  }
  
  /** Scrambles the cube. */
  Cube.prototype.scramble=function(scrambleCount) {
    if (scrambleCount==null) scrambleCount=21;
    
    this.setQuiet(true);
    
    // Keep track of previous axis, to avoid two subsequent moves on
    // the same axis.
    var prevAxis = -1;
    var axis, layerMask, angle;
    for (var i = 0; i < scrambleCount; i++) {
      while ((axis = Math.floor(Math.random()*3)) == prevAxis) {}
      prevAxis = axis;
      while ((layerMask = Math.floor(Math.random()*(1 << this.layerCount))) == 0) {}
      while ((angle = Math.floor(Math.random()*5) - 2) == 0) {}
      this.transform(axis, layerMask, angle);
    }
  
    this.setQuiet(false);
  }