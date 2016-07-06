// length of the cube in mm tenth
length=165;
// height of the cube in mm tenth
height=150;

// how many rows to generate
rows=1;

// how many pixels to generate in a row
cols=8;

// thikness of the wall in mm tenth
wall=10;

// hole width in mm tenth
//holeWidth=120;
holeWidth=length-wall*2;

// hole height in mm tenth
holeHeight=50;

// bottom thikness in mm tenth
bottomThikness=6;

// scale smaller so slicer sice is correct
scale(0.1) {
  for(j=[0:rows-1]) {  
    for(i=[0:cols-1]) {
      PixelCube(i*length,j*length);
    }
  }
}



module PixelCube(offsetRow,offSetCol) {
  translate([offsetRow,offSetCol,0]){
    difference() {
      cube([length,length,height]);
      // hollow the cube
      innerCubeLength=length-(wall*2);
      translate([wall,wall,bottomThikness]) {
        cube([innerCubeLength,innerCubeLength,height-bottomThikness]);
      }
  
      // add the hole on the left
      translate([0,(length-holeWidth)/2,height-holeHeight]) {
        cube([wall,holeWidth,holeHeight]);
      }
  
      // add the hole on the right
      translate([length-wall,(length-holeWidth)/2,height-holeHeight]) {
        cube([wall,holeWidth,holeHeight]);
      }
    }
  }
}
