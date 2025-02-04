#include "GUIManager.h"

int GUIManager::selected_fractal = 0;
bool GUIManager::is_3d = false;

void GUIManager::init(GLFWwindow* window) {
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGui::StyleColorsDark();

    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init("#version 430");
}

void GUIManager::render(float zoom2D) {
    ImGui_ImplOpenGL3_NewFrame();
    ImGui_ImplGlfw_NewFrame();
    ImGui::NewFrame();

    ImGui::BeginMainMenuBar();
    ImGui::Text("FPS: %.1f", ImGui::GetIO().Framerate);

    if (ImGui::BeginMenu("Fractal's List")) {
        if (ImGui::Selectable("Mandelbrot", selected_fractal == 0)) selected_fractal = 0;
        if (ImGui::Selectable("Julia's Set", selected_fractal == 1)) selected_fractal = 1;
        if (ImGui::Selectable("Serpinski's Triangle", selected_fractal == 2)) selected_fractal = 2;
        ImGui::EndMenu();
    }

    ImGui::Checkbox("3D", &is_3d);

    ImGui::Text("Zoom: %.10f", zoom2D);

    ImGui::Text("Tempo: %.2f", (float)ImGui::GetTime());

    ImGui::EndMainMenuBar();

    ImGui::Render();
    ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
}

void GUIManager::cleanUp() {
    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplGlfw_Shutdown();
    ImGui::DestroyContext();
}

bool GUIManager::is_3d_enabled() { return is_3d; }
int GUIManager::get_selected_fractal() { return selected_fractal; }
