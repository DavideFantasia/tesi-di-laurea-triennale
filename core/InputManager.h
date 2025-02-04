#pragma once

#include <GLFW/glfw3.h>

class InputManager {
public:
    enum class Mode {
        MODE_2D,
        MODE_3D
    };

    // Costruttore che inizializza le callback
    InputManager(GLFWwindow* window);

    // Funzione per impostare la modalità su 2D/3D
    void setMode(Mode mode);

    // Funzione per aggiornare lo stato dell'input
    void update();

    // Funzione per la modalità 2D (panning e zoom)
    void update2D();

    // Funzione per la modalità 3D (per esempio, movimento in 3D)
    void update3D();

    // Callback per la gestione dei tasti premuti
    static void keyCallback(GLFWwindow* window, int key, int scancode, int action, int mods);

    // Callback per il movimento del cursore
    static void cursorPosCallback(GLFWwindow* window, double xpos, double ypos);

    // Callback per lo scroll (zoom)
    static void scrollCallback(GLFWwindow* window, double xoffset, double yoffset);

    // Getter dello zoom
    float getZoom2D() { return zoom; }
    float getPanningX() { return panningX; }
    float getPanningY() { return panningY; }

private:
    GLFWwindow* window;  // Finestra GLFW
    static InputManager* instance;  // Puntatore statico all'unica istanza corrente
    Mode currentMode;  // Modalità corrente (2D o 3D)
    float cursorX, cursorY;  // Coordinate del cursore
    float panningX, panningY;
    float scrollZoom = 1.f;  // Livello di scroll
    float zoom = 1.f; // Zoom mappato in base al bisogno a partire al livello di scroll
};
