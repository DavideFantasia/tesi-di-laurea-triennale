# FractalGL Explorer

A 3D/2D rendering engine written in C++ based on OpenGL. This project allows you to visualize, calculate, and explore complex fractals in real-time, offering an interactive experience in both two-dimensional and navigable three-dimensional environments.

## Main Features

The engine supports a vast library of fractals, divided into two main categories:

* **2D Fractals**: 
    * Mandelbrot, Julia, Burning Ship, Sierpinski, Koch, Barnsley, Newton.
* **3D Fractals**: 
    * Mandelbulb and Mandelbox.

**Advanced Rendering Capabilities:**
* **Double Precision (Deep Zoom):** Ability to enable double-precision floating-point calculations to explore extreme depths in Mandelbrot, Julia, and Burning Ship fractals without losing detail.
* **Raymarching & Distance Estimators:** Advanced algorithms for volumetric rendering of 3D fractals.
* **Lighting and Shading:** Implementation of the Blinn-Phong lighting model combined with Horizon-Based Ambient Occlusion (HBAO) to give depth and realism to fractal surfaces.
* **User Interface (GUI):** Integrated menu to select the fractal type in real-time, tweak its parameters, or manage animations and precision modes.

## Technologies Used

This project is built using industry-standard graphics and math libraries:
* **C++**
* **OpenGL 4.3+** (Rendering via GLSL Fragment/Vertex shaders)
* **GLFW3** (Window and input management)
* **GLEW** (OpenGL extension wrangler)
* **GLM** (Mathematics library for matrices, vectors, and camera)
* **Dear ImGui** (Bloat-free graphical user interface)

## Navigation Controls

The exploration mechanics adapt automatically depending on the loaded fractal:

### 2D Navigation
* **Mouse Wheel:** Zoom In / Zoom Out.
* **Left Mouse Button (Drag):** Panning (Move the view).
* **Arrow Keys:** Alternative panning.

### 3D Navigation (Free Camera)
* **W / A / S / D:** Move forward, backward, and sideways.
* **Space / Left Shift:** Move up and down.
* **Left Mouse Button (Drag):** Rotate the camera (Pitch & Yaw).
* **Mouse Wheel:** Change the field of view (FOV/Zoom).
