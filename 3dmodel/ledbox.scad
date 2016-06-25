// length of the cube in mm
length=170;
// height of the cube in mm
height=360;
// hole size
hole=120;

// how many pixels to generate in a row
numCopies=4;

// thikness of the wall
wall=20;

// scale smaller so slicer sice is correct
scale(0.1) {
  for(i=[0:numCopies-1]) {
    PixelCube(i*length);
  }
}

/**
* Generates the pixelCube by the offset
*/
module PixelCube(offSet) {
  translate([0,offSet,0]) {
    difference() {
      cube(size=[length,length,height]);
      // hollow the cube
      translate([wall/2,wall/2,0]) {
        cube(size=[length-wall,length-wall,height]);
      }
  
      // right middle hole
      translate([(length-hole)/2,0,0]) {
        cube(size=[hole,wall,50]);
      }
  
      // left middle hole
      translate([(length-hole)/2,length-wall,0]) {
          cube(size=[hole,wall,50]);
      }
    }
  }
}



