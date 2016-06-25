// length of the cube in mm
length=150;
// height of the cube in mm
height=140;

// thikness of the wall
wall=20;

// scale smaller so slicer sice is correct
scale(0.1) {
difference() {
  cube(size=[length,length,height]);
    // hollow the cube
    translate([wall/2,wall/2,0]) {
    cube(size=[length-wall,length-wall,height]);
  }
  
  // right middle hole
  translate([length/3,0,0]) {
    cube(size=[50,wall,50]);
  }
  
  // left middle hole
  translate([length/3,length-wall,0]) {
    cube(size=[50,wall,50]);
  }
}
}
