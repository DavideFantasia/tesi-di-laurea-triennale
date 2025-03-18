#include "GUIManager.h"

int GUIManager::selected_fractal = 0;
bool GUIManager::is_3d = false;
std::vector<std::unique_ptr<Fractal>> GUIManager::fractals;

void GUIManager::init(GLFWwindow* window) {
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGui::StyleColorsDark();

    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init("#version 430");
    
    fractals.push_back(std::make_unique<Mandelbrot>());
    fractals.push_back(std::make_unique<Julia>());
    fractals.push_back(std::make_unique<Sierpinski>());
}

void GUIManager::render(float zoom2D) {
    ImGui_ImplOpenGL3_NewFrame();
    ImGui_ImplGlfw_NewFrame();
    ImGui::NewFrame();

    ImGui::BeginMainMenuBar();

    ImGui::Text("FPS: %.1f", ImGui::GetIO().Framerate);

    if (ImGui::BeginMenu("Fractal's List")) {
        if (ImGui::Selectable("Mandelbrot", selected_fractal == 0)) {
            selected_fractal = 0;
            fractals[selected_fractal]->reset_param();
        }
        if (ImGui::Selectable("Julia's Set", selected_fractal == 1)) { 
            selected_fractal = 1;
            fractals[selected_fractal]->reset_param();
        }
        if (ImGui::Selectable("Serpinski's Triangle", selected_fractal == 2)) {
            selected_fractal = 2;
            fractals[selected_fractal]->reset_param();
        }
        ImGui::EndMenu();
    }

    fractals[selected_fractal]->renderGUI();

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
Fractal& GUIManager::get_selected_fractal() { return *fractals[selected_fractal]; }


