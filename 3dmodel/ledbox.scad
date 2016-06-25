// length of the cube in mm
length=170;
// height of the cube in mm
height=360;
// hole size
hole=120;

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
  translate([(length-hole)/2,0,0]) {
    cube(size=[hole,wall,50]);
  }
  
  // left middle hole
  translate([(length-hole)/2,length-wall,0]) {
    cube(size=[hole,wall,50]);
  }
}
}
