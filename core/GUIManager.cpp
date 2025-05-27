#include "GUIManager.h"
#include <iostream>

int GUIManager::selected_fractal = 0;
InputManager::Mode GUIManager::current_mode = InputManager::Mode::MODE_2D;
bool GUIManager::wants_log = false;
std::vector<std::unique_ptr<Fractal>> GUIManager::fractals;

void GUIManager::init(GLFWwindow* window) {
    if (window) { std::cerr << "GLFW window is null!" << std::endl; }

    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGui::StyleColorsDark();

    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init("#version 430");

    ImGui::GetStyle().ScaleAllSizes(2.f); // Ingrandisce tutti i widget del 50%
    //2D
    fractals.push_back(std::make_unique<Mandelbrot>());
    fractals.push_back(std::make_unique<Julia>());
    fractals.push_back(std::make_unique<Burning_Ship>());
    fractals.push_back(std::make_unique<Sierpinski>());
    fractals.push_back(std::make_unique<Koch>());
    fractals.push_back(std::make_unique<Barnsley>());
    fractals.push_back(std::make_unique<Newton>());
    //3D
    fractals.push_back(std::make_unique<MandelBulb>());
}

void GUIManager::render() {
    ImGui_ImplOpenGL3_NewFrame();
    ImGui_ImplGlfw_NewFrame();
    ImGui::NewFrame();

    ImGui::BeginMainMenuBar();

    ImGui::Text("FPS: %.1f", ImGui::GetIO().Framerate);
    //impostazione della modalità se con autoscroll
    /*
    if (ImGui::Checkbox("Log", &wants_log)) {
        current_mode = InputManager::Mode::MODE_AUTOSCROLL;
    }
    */
    if (ImGui::BeginMenu("Fractal's List")) {
        //si itera sulla lista di frattali disponibili, mostrando il bottone per selezionarlo
        for (int i = 0; i < fractals.size(); i++) {
            if (ImGui::Selectable(fractals[i]->getName(), selected_fractal == i)) {
                selected_fractal = i;
                fractals[selected_fractal]->reset_param();
            }
        }
        ImGui::EndMenu();
    }

    if (!wants_log) {
        //impostazione della modalità di input in base al frattale selezionato
        fractals[selected_fractal]->get_3D() ?
            current_mode = InputManager::Mode::MODE_3D :
            current_mode = InputManager::Mode::MODE_2D;
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

InputManager::Mode GUIManager::getMode() { return current_mode; }
bool GUIManager::log_enabled() { return wants_log;  }
Fractal& GUIManager::get_selected_fractal() { return *fractals[selected_fractal]; }


