// length of the cube in mm
length=160;
// height of the cube in mm
height=360;
// hole size
hole=120;

// how many rows to generate
rows=2;

// how many pixels to generate in a row
cols=8;

// thikness of the wall
wall=20;

// scale smaller so slicer sice is correct
scale(0.1) {
  for(j=[0:rows-1]) {  
    for(i=[0:cols-1]) {
      PixelCube(i*length,j*length);
    }
  }
}

/**
* Generates the pixelCube by the offset
*/
module PixelCube(offSetCol,offsetRow) {
  translate([offsetRow,offSetCol,0]) {
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



