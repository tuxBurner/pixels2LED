// length of the cube in mm tenth
length=165;

// how many rows to generate
rows=2;

// how many pixels to generate in a row
cols=8;

// thikness of the wall in mm tenth
wall=10;

// bottom thikness in mm tenth
bottomThikness=6;

// lenght off the inner 
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
    cube([length,length,bottomThikness]);
    translate([wall,wall,bottomThikness]) {
      cube([innerLength,wall,bottomThikness]);
    }
    translate([wall,length-wall*2,bottomThikness]) {
      cube([innerLength,wall,bottomThikness]);
    }
  }
}