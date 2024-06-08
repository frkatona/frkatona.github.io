# Contact Angle Extraction Web Application

This web application is designed to extract contact angles from droplet images

## To Use

1. Upload an image of a droplet
   
2. Click around the droplet boundary in the image

3. [not yet implemented]

## Careful

this may not produce valid results if:

1.  the image is out of focus, poorly lit, or otherwise does not allow for clear droplet boundary identification

2.  the camera is not aligned with the droplet both in position and angle

3.  the focal length of the lens is inadequate to prevent substantial perspective warping

for DIY setups, it is recommended to use a tripod to steady the position and angle and a macro lens attachment to control focus and perspective distortion (though modern phones with dedicated telephoto lenses may be ok if the subject is properly distanced and centered).  Try to experiment with back light to create a clear boundary in the image.  For phones, try to lock the focus and exposure (i.e., disable auto-focus) once desirable settings are found (both Android and iOS generally support this).

## theory

### topics

- Young's Equation (contact angle, surface tension, and interfacial tension)

- Static (Sessile) vs Dynamic Contact Angles

- Advancing vs Receding Contact Angles, Hysteresis Angle, and the Tilting Plane Method

- Four methods for sessile drop contact angle measurement

  - Half Angle Fitting/ Height Width Method

  - Circle Fitting Method

  - Ellipse Fitting Method

  - Tangent Fitting Method

Resources:

- [Apex Instrument - website](https://www.apexicindia.com/technologies/contact-angle-measurement-technology)

- [Sessile Drop Technique - Wikipedia](https://en.wikipedia.org/wiki/Sessile_drop_technique)

## to-do

- immediate tasks
  
  - [ ] get the position dots to sit on top of the image

  - [ ] redraw dots on removal of a position

- medium-priority tasks

  - [ ] implement modeling and visualization of the droplet shape and the base line

    - [ ] predict the baseline points based on absolute position (bottom-most) and distance from the center (left-most and right-most)

    - [ ] implement contact angle extraction

- low-priority tasks
  
  - [ ] implement a way to navigate multiple files without interfering with existing data

  - [ ] implement a way to export the results as an image and CSV

  - [ ] extract other features (surface energy, droplet volume, surface tension, spread area, ?  what is it that you get from the leading/trailing edge angles or hystereses?)

  - [ ] some kind of basic image processing (e.g., black and white, change contrast, perform edge detection)

  - [ ] start with a fully automated detection of the droplet boundaries and let user fine-tune

  - [ ] some kind of image validity checking (e.g., pick 10 points on the surface and if its too curved then the image is perspective warped or if the hemisphere fit is too poor then the positions were picked poorly)

  - [ ] aesthetics/UX (on-hover effects, better color scheme, etc.)

  - [ ] show example helper images for ideal dot positioning and image quality (perhaps example bad images for out of focus, poorly lit, or perspective warped images)

  - [ ] research recommendations for best practices on drop size, substrate, reproducibility, and acceptable variance