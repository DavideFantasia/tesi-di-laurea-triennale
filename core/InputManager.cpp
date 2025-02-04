#include "InputManager.h"
#include <iostream>
#include <imgui.h>
#include <backends/imgui_impl_glfw.h>
#include <backends/imgui_impl_opengl3.h>


// Definizione del puntatore statico
InputManager* InputManager::instance = nullptr;

//costruttore
InputManager::InputManager(GLFWwindow* window) {
    this->window = window;

    // Imposta le callback di GLFW
    if (glfwRawMouseMotionSupported())
        glfwSetInputMode(window, GLFW_RAW_MOUSE_MOTION, GLFW_TRUE);

    glfwSetKeyCallback(window, keyCallback);
    glfwSetCursorPosCallback(window, cursorPosCallback);
    glfwSetScrollCallback(window, scrollCallback);

    // Imposta un puntatore statico all'istanza di InputManager per utilizzarlo nelle callback
    instance = this;

    // Imposta la modalità iniziale a 2D
    currentMode = Mode::MODE_2D;
}

void InputManager::setMode(Mode mode) {
    instance->currentMode = mode;
}

void InputManager::update() {
    // Gestisci la modalità 2D
    if (currentMode == Mode::MODE_2D) {
        update2D();
    }
    // Gestisci la modalità 3D
    else if (currentMode == Mode::MODE_3D) {
        update3D();
    }
}

void InputManager::update2D() {
    // Implementazione dello zoom tramite scroll del mouse
    if (scrollZoom < 0) {
        zoom *= 1.1f;  // Zoom in
    }
    else if (scrollZoom > 0) {
        zoom *= 0.9f;  // Zoom out
    }

    // Limita il range dello zoom
    zoom = std::max(0.0000001f, std::min(zoom, 100.0f));

    // Resetta lo scrollZoom
    scrollZoom = 0;

    // Ottieni la posizione corrente del mouse
    double xpos, ypos;
    
    glfwGetCursorPos(window, &xpos, &ypos);

    // Calcola la differenza rispetto alla posizione precedente del mouse
    
    if (glfwGetMouseButton(window, GLFW_MOUSE_BUTTON_1) == GLFW_PRESS) {  // Mouse sinistro premuto per panning
        double deltaX = xpos - cursorX;
        double deltaY = ypos - cursorY;

        // Aggiorna la posizione del centro del frattale in base al movimento del mouse
        // `deltaX` e `deltaY` determinano il panning
        // Puoi scegliere una scala per quanto il mouse sposta la visualizzazione
        float panningVelocity = 0.005f * zoom;
        panningX = deltaX * panningVelocity;
        panningY = deltaY * panningVelocity;

        // Aggiorna la posizione del cursore
        cursorX = xpos;
        cursorY = ypos;
    }
}

void InputManager::update3D() {
}

void InputManager::keyCallback(GLFWwindow* window, int key, int scancode, int action, int mods) {
    ImGui_ImplGlfw_KeyCallback(window, key, scancode, action, mods);
    if (ImGui::GetIO().WantCaptureKeyboard) return;

    // Cambio della modalità 2D/3D premendo il tasto "M"
    if (key == GLFW_KEY_M && action == GLFW_PRESS) {
        if (instance->currentMode == Mode::MODE_2D) {
            instance->currentMode = Mode::MODE_3D;
            std::cout << "Switched to 3D mode!" << std::endl;
        }
        else {
            instance->currentMode = Mode::MODE_2D;
            std::cout << "Switched to 2D mode!" << std::endl;
        }
    }
}

void InputManager::cursorPosCallback(GLFWwindow* window, double xpos, double ypos) {
    ImGui_ImplGlfw_CursorPosCallback(window, xpos, ypos);

    if (ImGui::GetIO().WantCaptureMouse) return;

    if (instance) {
        // Passa la posizione del mouse all'istanza
        instance->cursorX = xpos;
        instance->cursorY = ypos;
    }
}

void InputManager::scrollCallback(GLFWwindow* window, double xoffset, double yoffset) {
    ImGui_ImplGlfw_ScrollCallback(window, xoffset, yoffset);

    if (ImGui::GetIO().WantCaptureMouse) return;
    if (instance) {
        instance->scrollZoom = yoffset;  // Assegna il valore dello scroll alla variabile scrollZoom
    }
}
