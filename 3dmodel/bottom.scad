// length of the cube in mm tenth
length=165;

// how many rows to generate
rows=4;

// how many pixels to generate in a row
cols=8;

// thikness of the wall in mm tenth
wall=15;

// bottom thikness in mm tenth
bottomThikness=10;

ledWidth=105;

// lenght off the inner cube
innerLength=length-wall*2;


// scale smaller so slicer sice is correct
scale(0.1) {
  
  for(x=[0:cols-1]) {
    for(y=[0:rows-1]) {
      BottomCube(x*length,y*length);
    }
  }
}



module BottomCube(xOffset,yOffset) {
  translate([xOffset,yOffset,0]) {
    // bottom
    cube([length,length,bottomThikness]);
    //front side holders  
    translate([wall,wall,bottomThikness]) {
      difference() {
        // led stripe holder
        cube([innerLength,innerLength,bottomThikness]);
        translate([0,(innerLength-ledWidth)/2,0]) {
          cube([innerLength,ledWidth,bottomThikness]);
        }
      }
    }
  }
}