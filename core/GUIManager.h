#pragma once

#include <imgui.h>
#include <backends/imgui_impl_glfw.h>
#include <backends/imgui_impl_opengl3.h>

class GUIManager {
public:
    static void init(GLFWwindow* window);
    static void render(float zoom2D);
    static void cleanUp();

    static bool is_3d_enabled();
    static int get_selected_fractal();

private:
    static int selected_fractal;
    static bool is_3d;
};

