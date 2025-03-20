#include "InputManager.h"

// Definizione del puntatore statico
InputManager* InputManager::instance = nullptr;

//costruttore
InputManager::InputManager(GLFWwindow* window) : camera(Camera(glm::vec3(0.0f, 0.0f, 3.0f))){
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

/**
* Funzione di smistamento della strategia 2D/3D sulla base del discriminante (currentMode)
**/
void InputManager::update() {
    // Gestisci la modalità 2D
    switch (currentMode) {
        case Mode::MODE_2D:
            update2D();
            break;
        case Mode::MODE_3D:
            update3D();
            break;
        default:
            std::cout << "errore nella gestione della modalità di input"<<std::endl;
            exit(1);
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
        float deltaTime = ImGui::GetIO().DeltaTime;
        // Aggiorna la posizione del centro del frattale in base al movimento del mouse
        // `deltaX` e `deltaY` determinano il panning
        // Puoi scegliere una scala per quanto il mouse sposta la visualizzazione
        float panningVelocity = 0.5f * zoom * deltaTime;
        panningX = deltaX * panningVelocity;
        panningY = deltaY * panningVelocity;

        // Aggiorna la posizione del cursore
        cursorX = xpos;
        cursorY = ypos;
    }
}

void InputManager::update3D() {
    float deltaTime = ImGui::GetIO().DeltaTime;

    // Tasti di movimento della telecamera
    if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement::FORWARD, deltaTime);
    if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement::BACKWARD, deltaTime);
    if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement::LEFT, deltaTime);
    if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement::RIGHT, deltaTime);
    if (glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement::UP, deltaTime);
    if (glfwGetKey(window, GLFW_KEY_LEFT_SHIFT) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement::DOWN, deltaTime);

    // Calcola la differenza rispetto alla posizione precedente del mouse
    if (glfwGetMouseButton(window, GLFW_MOUSE_BUTTON_1) == GLFW_PRESS) {
        double xpos, ypos;
        glfwGetCursorPos(window, &xpos, &ypos);

        float xOffset = xpos - instance->cursorX;
        float yOffset = instance->cursorY - ypos;

        instance->cursorX = xpos;
        instance->cursorY = ypos;

        instance->camera.ProcessMouseMovement(xOffset, yOffset);
    }
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
        instance->camera.ProcessMouseScroll(yoffset);
    }
}
